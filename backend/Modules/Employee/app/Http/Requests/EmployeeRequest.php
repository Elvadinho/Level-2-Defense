<?php

namespace Modules\Employee\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Employee\Enums\EmploymentStatus;
use Illuminate\Validation\Rules\Enum;

class EmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'department_id' => ['required', 'exists:departments,id'],
            'job_title' => ['required', 'string', 'max:255'],
            'employment_status' => ['sometimes', 'string', new Enum(EmploymentStatus::class)],
            'hire_date' => ['required', 'date'],
        ];
    }
}
