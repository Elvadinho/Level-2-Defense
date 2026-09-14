<?php

namespace Modules\Employee\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Modules\Employee\Models\Employee;
use Illuminate\Database\Eloquent\Collection;

class EmployeeService
{
    public function getAll(): Collection
    {
        return Employee::with(['user', 'department'])->get();
    }

    public function create(array $data): Employee
    {
        return DB::transaction(function () use ($data) {
            $userId = $data['user_id'] ?? null;

            if (!$userId) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'role' => $data['role'] ?? 'employee',
                ]);
                $userId = $user->id;
            }

            return Employee::create([
                'user_id' => $userId,
                'department_id' => $data['department_id'],
                'job_title' => $data['job_title'],
                'employment_status' => $data['employment_status'] ?? $data['status'] ?? 'active',
                'hire_date' => $data['hire_date'],
            ]);
        });
    }

    public function update(Employee $employee, array $data): Employee
    {
        return DB::transaction(function () use ($employee, $data) {
            $employeeData = array_intersect_key($data, array_flip([
                'user_id', 'department_id', 'job_title', 'employment_status', 'hire_date',
            ]));
            if (array_key_exists('status', $data)) {
                $employeeData['employment_status'] = $data['status'];
            }
            $employee->update($employeeData);

            $userData = array_intersect_key($data, array_flip(['name', 'email']));
            if ($userData) {
                $employee->user->update($userData);
            }

            return $employee;
        });
    }

    public function delete(Employee $employee): void
    {
        $employee->delete();
    }
}
