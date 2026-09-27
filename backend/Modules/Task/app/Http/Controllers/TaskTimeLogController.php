<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Task\Http\Requests\TaskTimeLogRequest;
use Modules\Task\Models\Task;
use Modules\Task\Models\TaskTimeLog;
use Modules\Task\Services\TaskService;

class TaskTimeLogController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(Task $task): JsonResponse
    {
        $timeLogs = $this->taskService->getTimeLogs($task); // Will add pagination later
        $totalHours = $this->taskService->getTotalTimeSpent($task);

        return response()->json([
            'time_logs' => $timeLogs,
            'total_hours' => $totalHours,
        ]);
    }

    public function store(TaskTimeLogRequest $request, Task $task): JsonResponse
    {
        $timeLog = $this->taskService->logTime($task, $request->user()->id, $request->validated());
        return response()->json($timeLog->load('user'), 201);
    }

    public function update(TaskTimeLogRequest $request, TaskTimeLog $timeLog): JsonResponse
    {
        $updated = $this->taskService->updateTimeLog($timeLog, $request->validated());
        return response()->json($updated->load('user'));
    }

    public function destroy(TaskTimeLog $timeLog): JsonResponse
    {
        $this->taskService->deleteTimeLog($timeLog);
        return response()->json(['message' => 'Time log deleted successfully.']);
    }
}
