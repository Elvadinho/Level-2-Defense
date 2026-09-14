<?php

namespace Modules\Authentication\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Modules\Authentication\Enums\Role;
use Modules\Employee\Models\Employee;

class AuthService
{
  public function register(array $data): array
  {
    $user = DB::transaction(function () use ($data) {
      $user = User::create([
        'name' => $data['name'],
        'email' => $data['email'],
        'password' => Hash::make($data['password']),
        'role' => $data['role'] ?? 'employee',
      ]);
      if ($user->role === Role::EMPLOYEE) {
        Employee::create([
          'user_id' => $user->id,
          'department_id' => $data['department_id'],
          'job_title' => $data['job_title'],
          'hire_date' => $data['hire_date'],
          'employment_status' => 'active',
        ]);
      }
      return $user;
    });

    $token = Auth::guard('api')->login($user);

    return [
      'user' => $user,
      'token' => $token,
    ];
  }

  public function login(array $data): array
  {
    $credentials = [
      'email' => $data['email'],
      'password' => $data['password']
    ];

    if (!$token = Auth::guard('api')->attempt($credentials)) {
      throw new AuthenticationException('Invalid credentials.');
    }

    return [
      'user' => Auth::guard('api')->user(),
      'token' => $token,
    ];
  }

  public function logout(): void
  {
    Auth::guard('api')->logout();
  }
}
