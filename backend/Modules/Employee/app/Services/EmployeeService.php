<?php

namespace Modules\Employee\Services;

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
        return Employee::create($data);
    }

    public function update(Employee $employee, array $data): Employee
    {
        $employee->update($data);
        return $employee;
    }

    public function delete(Employee $employee): void
    {
        $employee->delete();
    }
}
