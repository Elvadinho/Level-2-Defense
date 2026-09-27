<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Task\Http\Requests\TaskDependencyRequest;
use Modules\Task\Models\Task;
use Modules\Task\Models\TaskDependency;
use Modules\Task\Services\TaskService;

class TaskDependencyController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(Task $task): JsonResponse
    {
        $dependencies = $this->taskService->getDependencies($task);
        $blockedTasks = $this->taskService->getBlockedTasks($task);

        return response()->json([
            'dependencies' => $dependencies,
            'blocked_tasks' => $blockedTasks,
        ]);
    }

    public function store(TaskDependencyRequest $request, Task $task): JsonResponse
    {
        try {
            $dependency = $this->taskService->addDependency(
                $task,
                $request->validated()['depends_on_task_id'],
                $request->validated()['dependency_type'] ?? 'finish_to_start'
            );

            return response()->json($dependency->load('dependsOnTask'), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function destroy(TaskDependency $dependency): JsonResponse
    {
        $this->taskService->removeDependency($dependency);
        return response()->json(['message' => 'Dependency removed successfully.']);
    }
}
