<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Task\Models\SavedFilter;
use Modules\Task\Services\TaskService;

class SavedFilterController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $this->taskService->getSavedFilters($request->user()->id);
        return response()->json($filters);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'filters' => 'required|array',
            'is_default' => 'sometimes|boolean',
        ]);

        $filter = $this->taskService->saveFilter(
            $request->user()->id,
            $validated['name'],
            $validated['filters'],
            $validated['is_default'] ?? false
        );

        return response()->json($filter, 201);
    }

    public function destroy(SavedFilter $filter): JsonResponse
    {
        $this->taskService->deleteSavedFilter($filter);
        return response()->json(['message' => 'Filter deleted successfully.']);
    }
}
