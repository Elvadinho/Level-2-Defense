<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Task\Http\Requests\SubtaskRequest;
use Modules\Task\Models\Task;
use Modules\Task\Models\Subtask;
use Modules\Task\Services\TaskService;

class SubtaskController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(Task $task): JsonResponse
    {
        return response()->json($this->taskService->getSubtasks($task));
    }

    public function store(SubtaskRequest $request, Task $task): JsonResponse
    {
        $subtask = $this->taskService->createSubtask($task, $request->validated());
        return response()->json($subtask->load('assignee.user'), 201);
    }

    public function update(SubtaskRequest $request, Subtask $subtask): JsonResponse
    {
        $updated = $this->taskService->updateSubtask($subtask, $request->validated());
        return response()->json($updated->load('assignee.user'));
    }

    public function toggleCompletion(Subtask $subtask): JsonResponse
    {
        $updated = $this->taskService->toggleSubtaskCompletion($subtask);
        return response()->json($updated);
    }

    public function destroy(Subtask $subtask): JsonResponse
    {
        $this->taskService->deleteSubtask($subtask);
        return response()->json(['message' => 'Subtask deleted successfully.']);
    }
}
