<?php

namespace Modules\Task\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Project\Models\Project;
use Modules\Task\Models\TaskTemplate;
use Modules\Task\Services\TaskService;

class TaskTemplateController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(Request $request): JsonResponse
    {
        $templates = $this->taskService->getTemplates($request->user()->id);
        return response()->json($templates);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'sometimes|string|in:low,medium,high,urgent',
            'subtasks' => 'nullable|array',
            'subtasks.*' => 'string',
            'custom_fields' => 'nullable|array',
            'is_public' => 'sometimes|boolean',
        ]);

        $template = $this->taskService->createTemplate($request->user()->id, $validated);
        return response()->json($template, 201);
    }

    public function apply(Request $request, Project $project, TaskTemplate $template): JsonResponse
    {
        $overrides = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:employees,id',
            'due_date' => 'nullable|date',
            'status' => 'nullable|string',
        ]);

        $task = $this->taskService->applyTemplate($project->id, $template, $overrides);
        $this->taskService->logActivity($task, $request->user()->id, 'created_from_template', "Created from template: {$template->name}");
        
        return response()->json($task, 201);
    }

    public function destroy(TaskTemplate $template): JsonResponse
    {
        $this->taskService->deleteTemplate($template);
        return response()->json(['message' => 'Template deleted successfully.']);
    }
}
