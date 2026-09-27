<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Task\Http\Requests\TaskCommentRequest;
use Modules\Task\Models\Task;
use Modules\Task\Models\TaskComment;
use Modules\Task\Services\TaskService;

class TaskCommentController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(Task $task): JsonResponse
    {
        return response()->json($this->taskService->getComments($task)); // Will add pagination later
    }

    public function store(TaskCommentRequest $request, Task $task): JsonResponse
    {
        $comment = $this->taskService->addComment(
            $task,
            $request->user()->id,
            $request->validated()['body']
        );

        return response()->json($comment->load('user'), 201);
    }

    public function update(TaskCommentRequest $request, TaskComment $comment): JsonResponse
    {
        $this->authorize('update', $comment);

        $updated = $this->taskService->updateComment($comment, $request->validated()['body']);
        return response()->json($updated->load('user'));
    }

    public function destroy(Request $request, TaskComment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $this->taskService->deleteComment($comment);
        return response()->json(['message' => 'Comment deleted successfully.']);
    }

    public function addReaction(Request $request, TaskComment $comment): JsonResponse
    {
        $request->validate([
            'reaction_type' => 'required|string|in:like,helpful,resolved',
        ]);

        $updated = $this->taskService->addReactionToComment($comment, $request->reaction_type);
        return response()->json($updated);
    }

    public function removeReaction(Request $request, TaskComment $comment): JsonResponse
    {
        $request->validate([
            'reaction_type' => 'required|string|in:like,helpful,resolved',
        ]);

        $updated = $this->taskService->removeReactionFromComment($comment, $request->reaction_type);
        return response()->json($updated);
    }
}
