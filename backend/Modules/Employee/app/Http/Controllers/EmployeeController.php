<?php

namespace Modules\Employee\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Employee\Http\Requests\EmployeeRequest;
use Modules\Employee\Models\Employee;
use Modules\Employee\Services\EmployeeService;

class EmployeeController extends Controller
{
    public function __construct(private readonly EmployeeService $employeeService) {}

    public function index(): JsonResponse
    {
        return response()->json($this->employeeService->getAll());
    }

    public function store(EmployeeRequest $request): JsonResponse
    {
        $employee = $this->employeeService->create($request->validated());
        return response()->json($employee->load(['user', 'department']), 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        return response()->json($employee->load(['user', 'department']));
    }

    public function update(EmployeeRequest $request, Employee $employee): JsonResponse
    {
        $update = $this->employeeService->update($employee, $request->validated());
        return response()->json($update->load(['user', 'department']));
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $this->employeeService->delete($employee);
        return response()->json(['message' => 'Employee deleted successfully.']);
    }
}
