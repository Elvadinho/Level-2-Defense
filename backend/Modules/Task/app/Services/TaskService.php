<?php

namespace Modules\Task\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Modules\Task\Models\Task;
use Modules\Task\Models\TaskComment;
use Modules\Task\Models\Subtask;
use Modules\Task\Models\TaskAttachment;
use Modules\Task\Models\TaskTimeLog;
use Modules\Task\Models\TaskWatcher;
use Modules\Task\Models\TaskDependency;
use Modules\Task\Models\TaskActivity;
use Modules\Task\Models\TaskTemplate;
use Modules\Task\Models\SavedFilter;

class TaskService
{
  public function getByProject(int $projectId): Collection
  {
    return Task::where('project_id', $projectId)
      ->with([
        'assignee.user',
        'comments.user',
        'subtasks.assignee.user',
        'attachments.uploader',
        'timeLogs.user',
        'watchers.user',
        'dependencies.dependsOnTask',
      ])
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

  // ==================== COMMENTS ====================
  
  public function addComment(Task $task, int $userId, string $body): TaskComment
  {
    return $task->comments()->create([
      'user_id' => $userId,
      'body' => $body,
    ]);
  }

  public function getComments(Task $task): Collection
  {
    return $task->comments()->with('user')->orderBy('created_at', 'desc')->get();
  }

  public function updateComment(TaskComment $comment, string $body): TaskComment
  {
    $comment->update([
      'body' => $body,
      'is_edited' => true,
      'edited_at' => now(),
    ]);
    return $comment->fresh();
  }

  public function deleteComment(TaskComment $comment): void
  {
    $comment->delete();
  }

  public function addReactionToComment(TaskComment $comment, string $reactionType): TaskComment
  {
    $reactions = $comment->reactions ?? [];
    
    if (!isset($reactions[$reactionType])) {
      $reactions[$reactionType] = 0;
    }
    
    $reactions[$reactionType]++;
    
    $comment->update(['reactions' => $reactions]);
    return $comment->fresh();
  }

  public function removeReactionFromComment(TaskComment $comment, string $reactionType): TaskComment
  {
    $reactions = $comment->reactions ?? [];
    
    if (isset($reactions[$reactionType]) && $reactions[$reactionType] > 0) {
      $reactions[$reactionType]--;
      
      if ($reactions[$reactionType] === 0) {
        unset($reactions[$reactionType]);
      }
    }
    
    $comment->update(['reactions' => $reactions]);
    return $comment->fresh();
  }

  // ==================== SUBTASKS ====================
  
  public function getSubtasks(Task $task): Collection
  {
    return $task->subtasks()->with('assignee.user')->orderBy('order')->get();
  }

  public function createSubtask(Task $task, array $data): Subtask
  {
    return $task->subtasks()->create($data);
  }

  public function updateSubtask(Subtask $subtask, array $data): Subtask
  {
    $subtask->update($data);
    return $subtask->fresh();
  }

  public function toggleSubtaskCompletion(Subtask $subtask): Subtask
  {
    $subtask->update(['is_completed' => !$subtask->is_completed]);
    return $subtask->fresh();
  }

  public function deleteSubtask(Subtask $subtask): void
  {
    $subtask->delete();
  }

  // ==================== ATTACHMENTS ====================
  
  public function getAttachments(Task $task): Collection
  {
    return $task->attachments()->with('uploader')->orderBy('created_at', 'desc')->get();
  }

  public function uploadAttachment(Task $task, int $userId, UploadedFile $file): TaskAttachment
  {
    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
    $filePath = $file->storeAs('task_attachments/' . $task->id, $filename, 'public');

    return $task->attachments()->create([
      'uploaded_by' => $userId,
      'filename' => $filename,
      'original_filename' => $file->getClientOriginalName(),
      'file_path' => $filePath,
      'mime_type' => $file->getMimeType(),
      'file_size' => $file->getSize(),
    ]);
  }

  public function deleteAttachment(TaskAttachment $attachment): void
  {
    // Delete file from storage
    Storage::disk('public')->delete($attachment->file_path);
    
    // Delete database record
    $attachment->delete();
  }

  // ==================== TIME LOGS ====================
  
  public function getTimeLogs(Task $task): Collection
  {
    return $task->timeLogs()->with('user')->orderBy('log_date', 'desc')->get();
  }

  public function logTime(Task $task, int $userId, array $data): TaskTimeLog
  {
    return $task->timeLogs()->create([
      'user_id' => $userId,
      'hours' => $data['hours'],
      'description' => $data['description'] ?? null,
      'log_date' => $data['log_date'] ?? now()->toDateString(),
    ]);
  }

  public function updateTimeLog(TaskTimeLog $timeLog, array $data): TaskTimeLog
  {
    $timeLog->update($data);
    return $timeLog->fresh();
  }

  public function deleteTimeLog(TaskTimeLog $timeLog): void
  {
    $timeLog->delete();
  }

  public function getTotalTimeSpent(Task $task): float
  {
    return $task->timeLogs()->sum('hours');
  }

  // ==================== WATCHERS ====================
  
  public function getWatchers(Task $task): Collection
  {
    return $task->watchers()->with('user')->get();
  }

  public function addWatcher(Task $task, int $userId): TaskWatcher
  {
    return $task->watchers()->firstOrCreate(['user_id' => $userId]);
  }

  public function removeWatcher(Task $task, int $userId): void
  {
    $task->watchers()->where('user_id', $userId)->delete();
  }

  public function isWatching(Task $task, int $userId): bool
  {
    return $task->watchers()->where('user_id', $userId)->exists();
  }

  // ==================== DEPENDENCIES ====================
  
  public function getDependencies(Task $task): Collection
  {
    return $task->dependencies()->with('dependsOnTask')->get();
  }

  public function addDependency(Task $task, int $dependsOnTaskId, string $type = 'finish_to_start'): TaskDependency
  {
    // Prevent circular dependencies
    if ($this->wouldCreateCircularDependency($task->id, $dependsOnTaskId)) {
      throw new \Exception('Cannot create circular dependency');
    }

    return $task->dependencies()->create([
      'depends_on_task_id' => $dependsOnTaskId,
      'dependency_type' => $type,
    ]);
  }

  public function removeDependency(TaskDependency $dependency): void
  {
    $dependency->delete();
  }

  public function getBlockedTasks(Task $task): Collection
  {
    return Task::whereHas('dependencies', function ($query) use ($task) {
      $query->where('depends_on_task_id', $task->id);
    })->get();
  }

  protected function wouldCreateCircularDependency(int $taskId, int $dependsOnTaskId): bool
  {
    // Check if adding this dependency would create a circle
    $visited = [];
    return $this->hasPath($dependsOnTaskId, $taskId, $visited);
  }

  protected function hasPath(int $fromTaskId, int $toTaskId, array &$visited): bool
  {
    if ($fromTaskId === $toTaskId) {
      return true;
    }

    if (in_array($fromTaskId, $visited)) {
      return false;
    }

    $visited[] = $fromTaskId;

    $dependencies = TaskDependency::where('task_id', $fromTaskId)->pluck('depends_on_task_id');

    foreach ($dependencies as $dependsOn) {
      if ($this->hasPath($dependsOn, $toTaskId, $visited)) {
        return true;
      }
    }

    return false;
  }

  // ==================== ACTIVITY LOGGING ====================
  
  public function logActivity(Task $task, int $userId, string $action, ?string $description = null, ?array $changes = null): void
  {
    $task->activities()->create([
      'user_id' => $userId,
      'action' => $action,
      'description' => $description,
      'changes' => $changes,
    ]);
  }

  public function getActivities(Task $task, int $limit = 50): Collection
  {
    return $task->activities()
      ->with('user')
      ->orderBy('created_at', 'desc')
      ->limit($limit)
      ->get();
  }

  // ==================== TASK TEMPLATES ====================
  
  public function createTemplate(int $userId, array $data): TaskTemplate
  {
    return TaskTemplate::create([
      'created_by' => $userId,
      'name' => $data['name'],
      'description' => $data['description'] ?? null,
      'priority' => $data['priority'] ?? 'medium',
      'subtasks' => $data['subtasks'] ?? null,
      'custom_fields' => $data['custom_fields'] ?? null,
      'is_public' => $data['is_public'] ?? false,
    ]);
  }

  public function getTemplates(?int $userId = null): Collection
  {
    $query = TaskTemplate::query();
    
    if ($userId) {
      $query->where(function($q) use ($userId) {
        $q->where('is_public', true)
          ->orWhere('created_by', $userId);
      });
    } else {
      $query->where('is_public', true);
    }
    
    return $query->with('creator')->get();
  }

  public function applyTemplate(int $projectId, TaskTemplate $template, array $overrides = []): Task
  {
    $taskData = [
      'project_id' => $projectId,
      'title' => $overrides['title'] ?? $template->name,
      'description' => $overrides['description'] ?? $template->description,
      'priority' => $overrides['priority'] ?? $template->priority,
      'status' => $overrides['status'] ?? 'todo',
      'assigned_to' => $overrides['assigned_to'] ?? null,
      'due_date' => $overrides['due_date'] ?? null,
    ];

    $task = $this->create($taskData);

    // Create subtasks from template
    if ($template->subtasks) {
      foreach ($template->subtasks as $index => $subtaskTitle) {
        $task->subtasks()->create([
          'title' => $subtaskTitle,
          'order' => $index,
        ]);
      }
    }

    return $task->load('subtasks');
  }

  public function deleteTemplate(TaskTemplate $template): void
  {
    $template->delete();
  }

  // ==================== SAVED FILTERS ====================
  
  public function saveFilter(int $userId, string $name, array $filters, bool $isDefault = false): SavedFilter
  {
    // If setting as default, unset other defaults
    if ($isDefault) {
      SavedFilter::where('user_id', $userId)->update(['is_default' => false]);
    }

    return SavedFilter::create([
      'user_id' => $userId,
      'name' => $name,
      'filters' => $filters,
      'is_default' => $isDefault,
    ]);
  }

  public function getSavedFilters(int $userId): Collection
  {
    return SavedFilter::where('user_id', $userId)->get();
  }

  public function deleteSavedFilter(SavedFilter $filter): void
  {
    $filter->delete();
  }
}
