<?php

namespace Modules\Employee\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $departmentId = $this->route('department') ? $this->route('department')->id : null;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('departments')->ignore($departmentId)
            ],
            'description' => ['nullable', 'string'],
        ];
    }
}
