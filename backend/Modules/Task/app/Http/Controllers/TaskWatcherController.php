<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Task\Models\Task;
use Modules\Task\Services\TaskService;

class TaskWatcherController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(Task $task): JsonResponse
    {
        return response()->json($this->taskService->getWatchers($task));
    }

    public function store(Request $request, Task $task): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $watcher = $this->taskService->addWatcher($task, $request->user_id);
        return response()->json($watcher->load('user'), 201);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $this->taskService->removeWatcher($task, $request->user_id);
        return response()->json(['message' => 'Watcher removed successfully.']);
    }

    public function toggle(Request $request, Task $task): JsonResponse
    {
        $userId = $request->user()->id;
        $isWatching = $this->taskService->isWatching($task, $userId);

        if ($isWatching) {
            $this->taskService->removeWatcher($task, $userId);
            return response()->json(['watching' => false, 'message' => 'Stopped watching task.']);
        } else {
            $this->taskService->addWatcher($task, $userId);
            return response()->json(['watching' => true, 'message' => 'Now watching task.']);
        }
    }
}
