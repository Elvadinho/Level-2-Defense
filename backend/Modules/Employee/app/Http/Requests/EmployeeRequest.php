<?php

namespace Modules\Employee\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Employee\Enums\EmploymentStatus;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

class EmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $employee = $this->route('employee');
        $creating = $this->isMethod('post');
        $linkingExistingUser = $this->filled('user_id');

        return [
            // An employee can be linked to an existing account, or the admin can
            // create the employee and their login account in one operation.
            'user_id' => ['nullable', 'exists:users,id', Rule::unique('employees', 'user_id')->ignore($employee?->id)],
            'name' => [$creating && !$linkingExistingUser ? 'required' : 'sometimes', 'nullable', 'string', 'max:255'],
            'email' => [$creating && !$linkingExistingUser ? 'required' : 'sometimes', 'nullable', 'email', 'max:255', ...($linkingExistingUser ? [] : [Rule::unique('users', 'email')->ignore($employee?->user_id)])],
            'password' => [$creating && !$linkingExistingUser ? 'required' : 'nullable', 'nullable', 'string', 'confirmed', Password::defaults()],
            'role' => ['sometimes', 'string', new \Illuminate\Validation\Rules\Enum(\Modules\Authentication\Enums\Role::class)],
            'department_id' => ['required', 'exists:departments,id'],
            'job_title' => ['required', 'string', 'max:255'],
            'employment_status' => ['sometimes', 'string', new Enum(EmploymentStatus::class)],
            'status' => ['sometimes', 'string', new Enum(EmploymentStatus::class)],
            'hire_date' => ['required', 'date'],
        ];
    }
}
