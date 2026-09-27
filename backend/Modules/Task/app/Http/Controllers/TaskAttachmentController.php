<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Task\Models\Task;
use Modules\Task\Models\TaskAttachment;
use Modules\Task\Services\TaskService;

class TaskAttachmentController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(Task $task): JsonResponse
    {
        return response()->json($this->taskService->getAttachments($task));
    }

    public function store(Request $request, Task $task): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
        ]);

        $attachment = $this->taskService->uploadAttachment(
            $task,
            $request->user()->id,
            $request->file('file')
        );

        return response()->json($attachment->load('uploader'), 201);
    }

    public function destroy(TaskAttachment $attachment): JsonResponse
    {
        $this->taskService->deleteAttachment($attachment);
        return response()->json(['message' => 'Attachment deleted successfully.']);
    }
}
