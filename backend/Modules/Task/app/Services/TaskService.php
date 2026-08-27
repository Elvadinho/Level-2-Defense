<?php

namespace Modules\Task\Services;

use Illuminate\Database\Eloquent\Collection;
use Modules\Task\Models\Task;
use Modules\Task\Models\TaskComment;

class TaskService
{
  public function getByProject(int $projectId): Collection
  {
    return Task::where('project_id', $projectId)
      ->with(['assignee.user', 'comments.user'])
      ->get();
  }

  public function create(array $data): Task
  {
    return Task::create($data);
  }

  public function update(Task $task, array $data): Task
  {
    $task->update($data);
    return $task;
  }

  public function delete(Task $task): void
  {
    $task->delete();
  }

  public function addComment(Task $task, int $userId, string $body): TaskComment
  {
    return $task->comments()->create([
      'user_id' => $userId,
      'body' => $body,
    ]);
  }

  public function getComments(Task $task): Collection
  {
    return $task->comments()->with('user')->get();
  }
}
