<?php

namespace Modules\Employee\Services;

use Modules\Employee\Models\Department;
use Illuminate\Database\Eloquent\Collection;

class DepartmentService
{
    public function getAll(): Collection
    {
        return Department::all();
    }

    public function create(array $date): Department
    {
        return Department::create($date);
    }

    public function update(Department $department, array $data): Department
    {
        $department->update($data);
        return $department;
    }

    public function delete(Department $department): void
    {
        // Remember: our database migration has 'restrictOnDelete()'
        // If this department has employees, SQL will throw an error preventing deletion!
        $department->delete();
    }
}
