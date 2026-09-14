<?php

namespace Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Modules\Authentication\Enums\Role;
use Modules\Employee\Models\Department;
use Modules\Employee\Models\Employee;
use Illuminate\Support\Facades\DB;
use Modules\Authentication\Http\Requests\LoginRequest;
use Modules\Authentication\Http\Requests\RegisterRequest;
use Modules\Authentication\Services\AuthService;

class AuthController extends Controller
{
  public function __construct(
    private readonly AuthService $authService
  ) {
  }

  // Register a new User
  public function register(RegisterRequest $request): JsonResponse
  {
    $result = $this->authService->register($request->validated());

    return response()->json([
      'message' => 'Registration Successful.',
      'user' => $result['user'],
      'token' => $result['token'],
    ], 201);
  }


  // Login an existing user
  public function login(LoginRequest $request): JsonResponse
  {
    try {
      $result = $this->authService->login($request->validated());

      return response()->json([
        'message' => 'Login Successful.',
        'user' => $result['user'],
        'token' => $result['token'],
      ], 200);
    } catch (AuthenticationException) {
      return response()->json([
        'message' => 'Invalid credentials.',
      ], 401);
    }
  }

  public function logout(Request $request): JsonResponse
  {
    // JWT invalidates the token on logout
    $this->authService->logout();

    return response()->json([
      'message' => 'Logged out Successfully.',
    ], 200);
  }

  // Get the authenticated user's profile
  public function profile(Request $request): JsonResponse
  {
    return response()->json([
      'user' => $request->user(),
    ], 200);
  }

  /** Administrator-only account directory and account lifecycle endpoints. */
  public function users(Request $request): JsonResponse
  {
    $this->ensureAdmin($request);
    return response()->json(User::query()->with('employee.department')->select(['id', 'name', 'email', 'role', 'created_at', 'updated_at'])->latest()->get());
  }

  /** Public, read-only department choices used by the employee registration form. */
  public function departments(): JsonResponse
  {
    return response()->json(Department::query()->select(['id', 'name'])->orderBy('name')->get());
  }

  public function createUser(Request $request): JsonResponse
  {
    $this->ensureAdmin($request);
    $data = $this->validateUserData($request, true);
    $user = DB::transaction(function () use ($data) {
      $user = User::create([
        'name' => $data['name'],
        'email' => $data['email'],
        'password' => Hash::make($data['password']),
        'role' => $data['role'],
      ]);
      $this->syncEmployeeProfile($user, $data);
      return $user;
    });
    return response()->json($user->load('employee.department'), 201);
  }

  public function updateUser(Request $request, User $user): JsonResponse
  {
    $this->ensureAdmin($request);
    $data = $this->validateUserData($request, false);
    $user = DB::transaction(function () use ($user, $data) {
      $account = array_intersect_key($data, array_flip(['name', 'email', 'role', 'password']));
      if (!empty($account['password'])) {
        $account['password'] = Hash::make($account['password']);
      } else {
        unset($account['password']);
      }
      $user->update($account);
      $this->syncEmployeeProfile($user, $data);
      return $user;
    });
    return response()->json($user->load('employee.department'));
  }

  private function validateUserData(Request $request, bool $creating): array
  {
    $user = $request->route('user');
    return $request->validate([
      'name' => ['required', 'string', 'max:255'],
      'email' => ['required', 'email', 'max:255', 'unique:users,email,' . ($user?->id ?? 'NULL')],
      'password' => [$creating ? 'required' : 'nullable', 'string', 'confirmed', 'min:8'],
      'role' => ['required', new \Illuminate\Validation\Rules\Enum(Role::class)],
      'department_id' => ['required_if:role,employee', 'nullable', 'exists:departments,id'],
      'job_title' => ['required_if:role,employee', 'nullable', 'string', 'max:255'],
      'hire_date' => ['required_if:role,employee', 'nullable', 'date'],
    ]);
  }

  private function syncEmployeeProfile(User $user, array $data): void
  {
    if ($user->role !== Role::EMPLOYEE) {
      return;
    }

    $profile = $user->employee;
    $profileData = [
      'department_id' => $data['department_id'],
      'job_title' => $data['job_title'],
      'hire_date' => $data['hire_date'],
    ];
    if ($profile) {
      $profile->update($profileData);
    } else {
      Employee::create([...$profileData, 'user_id' => $user->id, 'employment_status' => 'active']);
    }
  }

  public function deleteUser(Request $request, User $user): JsonResponse
  {
    $this->ensureAdmin($request);
    if ($request->user()->is($user)) {
      return response()->json(['message' => 'You cannot delete your own account.'], 422);
    }
    $user->delete();
    return response()->json(['message' => 'User account deleted.']);
  }

  private function ensureAdmin(Request $request): void
  {
    abort_unless($request->user()?->role === Role::ADMIN, 403, 'Administrator access is required.');
  }
}
