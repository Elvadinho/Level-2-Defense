<?php

namespace Modules\Employee\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Employee\Http\Requests\DepartmentRequest;
use Modules\Employee\Models\Department;
use Modules\Employee\Services\DepartmentService;

class DepartmentController extends Controller
{
    public function __construct(private readonly DepartmentService $departmentService)
    {

    }

    public function index(): JsonResponse
    {
        return response()->json($this->departmentService->getAll());
    }

    public function store(DepartmentRequest $request): JsonResponse
    {
        $department = $this->departmentService->create($request->validated());
        return response()->json($department, 201);
    }

    public function show(Department $department): JsonResponse
    {
        return response()->json($department);
    }

    public function update(DepartmentRequest $request, Department $department): JsonResponse
    {
        $updated = $this->departmentService->update($department, $request->validated());
        return response()->json($updated);
    }

    public function destroy(Department $department): JsonResponse
    {
        try {
            $this->departmentService->delete($department);
            return response()->json(['message' => 'Department deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Cannot delete department. It may have employees assigned.', 409]);
        }
    }
}
