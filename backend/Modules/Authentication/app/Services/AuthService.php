<?php

namespace Modules\Authentication\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\AuthenticationException;

class AuthService
{
  /**
   * Register a new user and generate an API token.
   *
   * @param array $data Validated registration data
   * @return array ['user' => User, 'token' => string]
   */
  public function register(array $data): array
  {
    $user = User::create([
      'name' => $data['name'],
      'email' => $data['email'],
      'password' => $data['password'],
      'role' => $data['role'] ?? 'employee',
    ]);

    $token = $user->createToken('auth-token')->plainTextToken;

    return [
      'user' => $user,
      'token' => $token,
    ];
  }

  // Authenticate a user and generate a new API token
  public function login(array $data): array
  {
    $user = User::where('email', $data['email'])->first();

    if (!$user || !Hash::check($data['password'], $user->password)) {
      throw new AuthenticationException('Invalid credentials.');
    }

    // Revoke all previous token (single active session)
    $user->tokens()->delete();

    $token = $user->createToken('auth-token')->plainTextToken;

    return [
      'user' => $user,
      'token' => $token,
    ];
  }

  // Logout - revoke the current access token
  public function logout(User $user): void
  {
    $user->currentAccessToken()->delete();
  }
}
