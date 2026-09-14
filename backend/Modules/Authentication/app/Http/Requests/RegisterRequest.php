<?php

namespace Modules\Authentication\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Authentication\Enums\Role;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => ['required', 'string', 'max:255'],
      'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
      'password' => ['required', 'string', 'confirmed', Password::defaults()],
      'role' => ['sometimes', 'string', new Enum(Role::class)],
      'department_id' => ['required_if:role,employee', 'nullable', 'exists:departments,id'],
      'job_title' => ['required_if:role,employee', 'nullable', 'string', 'max:255'],
      'hire_date' => ['required_if:role,employee', 'nullable', 'date'],
    ];
  }
}
