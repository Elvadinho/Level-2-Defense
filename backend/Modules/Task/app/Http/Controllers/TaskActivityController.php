<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Task\Models\Task;
use Modules\Task\Services\TaskService;

class TaskActivityController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(Task $task): JsonResponse
    {
        // Will add pagination
        $activities = $this->taskService->getActivities($task);
        return response()->json($activities);
    }
}
