<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Project\Http\Requests\ProjectRequest;
use Modules\Project\Models\Project;
use Modules\Project\Services\ProjectService;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $projectService) {}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->projectService->getAll());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ProjectRequest $request): JsonResponse
    {
        $project = $this->projectService->create($request->validated());
        return response()->json($project->load(['manager.user', 'members']), 201);
    }

    /**
     * Show the specified resource.
     */
    public function show(Project $project): JsonResponse
    {
        return response()->json($project->load(['manager.user', 'members.user', 'tasks']));
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(ProjectRequest $request, Project $project): JsonResponse
    {
        $updated = $this->projectService->update($project, $request->validated());
        return response()->json($updated->load(['manager.user', 'members.user']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project): JsonResponse
    {
        $this->projectService->delete($project);
        return response()->json(['message' => 'Project deleted successfully.']);
    }

    // Add an employee to this project
    public function addMember(Request $request, Project $project): JsonResponse
    {
        $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'role' => ['sometimes', 'string', 'max:100'],
        ]);

        $this->projectService->addMember(
            $project,
            $request->employee_id,
            $request->input('role', 'member')
        );

        return response()->json(['message' => 'Member added to project.'], 201);
    }

    // Remove an employee from this project
    public function removeMember(Project $project, int $employee): JsonResponse
    {
        $this->projectService->removeMember($project, $employee);
        return response()->json(['message' => 'Member removed from project.']);
    }

    // List all members of a project
    public function members(Project $project): JsonResponse
    {
        return response()->json($this->projectService->getMembers($project));
    }
}
