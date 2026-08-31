<?php

namespace Modules\Authentication\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;

class AuthService
{
  public function register(array $data): array
  {
    $user = User::create([
      'name' => $data['name'],
      'email' => $data['email'],
      'password' => Hash::make($data['password']), // Ensure hashing
      'role' => $data['role'] ?? 'employee',
    ]);

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
