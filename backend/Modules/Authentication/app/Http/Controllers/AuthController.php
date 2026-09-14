<?php

namespace Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Modules\Authentication\Enums\Role;
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
    return response()->json(User::query()->select(['id', 'name', 'email', 'role', 'created_at', 'updated_at'])->latest()->get());
  }

  public function createUser(Request $request): JsonResponse
  {
    $this->ensureAdmin($request);
    $data = $request->validate([
      'name' => ['required', 'string', 'max:255'],
      'email' => ['required', 'email', 'max:255', 'unique:users,email'],
      'password' => ['required', 'string', 'confirmed', 'min:8'],
      'role' => ['required', new \Illuminate\Validation\Rules\Enum(Role::class)],
    ]);
    $user = User::create([...$data, 'password' => Hash::make($data['password'])]);
    return response()->json($user, 201);
  }

  public function updateUser(Request $request, User $user): JsonResponse
  {
    $this->ensureAdmin($request);
    $data = $request->validate([
      'name' => ['sometimes', 'string', 'max:255'],
      'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,' . $user->id],
      'role' => ['sometimes', new \Illuminate\Validation\Rules\Enum(Role::class)],
      'password' => ['nullable', 'string', 'confirmed', 'min:8'],
    ]);
    if (!empty($data['password'])) {
      $data['password'] = Hash::make($data['password']);
    } else {
      unset($data['password']);
    }
    $user->update($data);
    return response()->json($user);
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
