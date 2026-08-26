<?php

namespace Modules\Project\Services;

use Modules\Project\Models\Project;
use Illuminate\Database\Eloquent\Collection;

class ProjectService
{
  public function getAll(): Collection
  {
    return Project::with(['manager.user', 'members.user'])->get();
  }

  public function create(array $data): Project
  {
    return Project::create($data);
  }

  public function update(project $project, array $data): Project
  {
    $project->update($data);
    return $project;
  }

  public function delete(Project $project): void
  {
    $project->delete();
  }

  public function addMember(Project $project, int $employeeId, string $role = 'member'): void
  {
    $project->members()->syncWithoutDetaching([
      $employeeId => ['role' => $role],
    ]);
  }

  public function removeMember(Project $project, int $employeeId): void
  {
    $project->members()->detach($employeeId);
  }

  public function getMembers(Project $project): \Illuminate\Support\Collection
  {
    return $project->members()->with('user')->get();
  }
}
