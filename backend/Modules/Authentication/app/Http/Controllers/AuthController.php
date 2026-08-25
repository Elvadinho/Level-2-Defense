<?php

namespace Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Authentication\Http\Requests\LoginRequest;
use Modules\Authentication\Http\Requests\RegisterRequest;
use Modules\Authentication\Services\AuthService;

class AuthController extends Controller
{
  public function __construct(
    private readonly AuthService $authService
  ) {}

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
    $this->authService->logout($request->user());

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
}
