<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Project\Models\Project;
use Modules\Task\Http\Requests\TaskRequest;
use Modules\Task\Http\Requests\TaskCommentRequest;
use Modules\Task\Http\Requests\SubtaskRequest;
use Modules\Task\Http\Requests\TaskTimeLogRequest;
use Modules\Task\Http\Requests\TaskDependencyRequest;
use Modules\Task\Models\Task;
use Modules\Task\Models\TaskComment;
use Modules\Task\Models\Subtask;
use Modules\Task\Models\TaskAttachment;
use Modules\Task\Models\TaskTimeLog;
use Modules\Task\Models\TaskDependency;
use Modules\Task\Services\TaskService;

class TaskController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    //    List  all tasks for a specific project
    public function index(Project $project): JsonResponse
    {
        return response()->json($this->taskService->getByProject($project->id));
    }

    // Create atask under a project
    public function store(TaskRequest $request, Project $project): JsonResponse
    {
        $data = $request->validated();
        $data['project_id'] = $project->id;

        $task = $this->taskService->create($data);
        return response()->json($task->load(['assignee.user', 'project']), 201);
    }

    public function show(Task $task): JsonResponse
    {
        return response()->json($task->load([
            'assignee.user',
            'project',
            'comments.user',
            'subtasks.assignee.user',
            'attachments.uploader',
            'timeLogs.user',
            'watchers.user',
            'dependencies.dependsOnTask',
        ]));
    }

    public function update(TaskRequest $request, Task $task): JsonResponse
    {
        $updated = $this->taskService->update($task, $request->validated());
        return response()->json($updated->load(['assignee.user', 'project']));
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->taskService->delete($task);
        return response()->json(['message' => 'Task deleted successfully.']);
    }

}
