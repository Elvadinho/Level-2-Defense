<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Project\Models\Project;
use Modules\Task\Http\Requests\TaskRequest;
use Modules\Task\Http\Requests\TaskCommentRequest;
use Modules\Task\Models\Task;
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
        return response()->json($task->load(['assignee.user', 'project', 'comments.user']));
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

    public function addComment(TaskCommentRequest $request, Task $task): JsonResponse
    {
        $comment = $this->taskService->addComment(
            $task,
            $request->user()->id,
            $request->validated()['body']
        );

        return response()->json($comment->load('user'), 201);
    }

    public function comments(Task $task): JsonResponse
    {
        return response()->json($this->taskService->getComments($task));
    }
}
