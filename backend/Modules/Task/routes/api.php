<?php

use Illuminate\Support\Facades\Route;
use Modules\Task\Http\Controllers\TaskController;

Route::middleware('auth:api')->group(function () {
    // Tasks scoped under a project
    Route::get('projects/{project}/tasks', [TaskController::class, 'index']);
    Route::post('projects/{project}/tasks', [TaskController::class, 'store']);

    // Tasks by ID (no project needed)
    Route::get('tasks/{task}', [TaskController::class, 'show']);
    Route::put('tasks/{task}', [TaskController::class, 'update']);
    Route::delete('tasks/{task}', [TaskController::class, 'destroy']);

    // Task comments
    Route::get('tasks/{task}/comments', [\Modules\Task\Http\Controllers\TaskCommentController::class, 'index']);
    Route::post('tasks/{task}/comments', [\Modules\Task\Http\Controllers\TaskCommentController::class, 'store']);
    Route::put('comments/{comment}', [\Modules\Task\Http\Controllers\TaskCommentController::class, 'update']);
    Route::delete('comments/{comment}', [\Modules\Task\Http\Controllers\TaskCommentController::class, 'destroy']);
    
    // Comment reactions
    Route::post('comments/{comment}/reactions', [\Modules\Task\Http\Controllers\TaskCommentController::class, 'addReaction']);
    Route::delete('comments/{comment}/reactions', [\Modules\Task\Http\Controllers\TaskCommentController::class, 'removeReaction']);

    // Subtasks
    Route::get('tasks/{task}/subtasks', [\Modules\Task\Http\Controllers\SubtaskController::class, 'index']);
    Route::post('tasks/{task}/subtasks', [\Modules\Task\Http\Controllers\SubtaskController::class, 'store']);
    Route::put('subtasks/{subtask}', [\Modules\Task\Http\Controllers\SubtaskController::class, 'update']);
    Route::post('subtasks/{subtask}/toggle', [\Modules\Task\Http\Controllers\SubtaskController::class, 'toggleCompletion']);
    Route::delete('subtasks/{subtask}', [\Modules\Task\Http\Controllers\SubtaskController::class, 'destroy']);

    // Attachments
    Route::get('tasks/{task}/attachments', [\Modules\Task\Http\Controllers\TaskAttachmentController::class, 'index']);
    Route::post('tasks/{task}/attachments', [\Modules\Task\Http\Controllers\TaskAttachmentController::class, 'store']);
    Route::delete('attachments/{attachment}', [\Modules\Task\Http\Controllers\TaskAttachmentController::class, 'destroy']);

    // Time logs
    Route::get('tasks/{task}/time-logs', [\Modules\Task\Http\Controllers\TaskTimeLogController::class, 'index']);
    Route::post('tasks/{task}/time-logs', [\Modules\Task\Http\Controllers\TaskTimeLogController::class, 'store']);
    Route::put('time-logs/{timeLog}', [\Modules\Task\Http\Controllers\TaskTimeLogController::class, 'update']);
    Route::delete('time-logs/{timeLog}', [\Modules\Task\Http\Controllers\TaskTimeLogController::class, 'destroy']);

    // Watchers
    Route::get('tasks/{task}/watchers', [\Modules\Task\Http\Controllers\TaskWatcherController::class, 'index']);
    Route::post('tasks/{task}/watchers', [\Modules\Task\Http\Controllers\TaskWatcherController::class, 'store']);
    Route::delete('tasks/{task}/watchers', [\Modules\Task\Http\Controllers\TaskWatcherController::class, 'destroy']);
    Route::post('tasks/{task}/watch-toggle', [\Modules\Task\Http\Controllers\TaskWatcherController::class, 'toggle']);

    // Dependencies
    Route::get('tasks/{task}/dependencies', [\Modules\Task\Http\Controllers\TaskDependencyController::class, 'index']);
    Route::post('tasks/{task}/dependencies', [\Modules\Task\Http\Controllers\TaskDependencyController::class, 'store']);
    Route::delete('dependencies/{dependency}', [\Modules\Task\Http\Controllers\TaskDependencyController::class, 'destroy']);

    // Activity Feed
    Route::get('tasks/{task}/activities', [\Modules\Task\Http\Controllers\TaskActivityController::class, 'index']);

    // Task Templates
    Route::get('templates', [\Modules\Task\Http\Controllers\TaskTemplateController::class, 'index']);
    Route::post('templates', [\Modules\Task\Http\Controllers\TaskTemplateController::class, 'store']);
    Route::post('projects/{project}/tasks/from-template/{template}', [\Modules\Task\Http\Controllers\TaskTemplateController::class, 'apply']);
    Route::delete('templates/{template}', [\Modules\Task\Http\Controllers\TaskTemplateController::class, 'destroy']);

    // Saved Filters
    Route::get('saved-filters', [\Modules\Task\Http\Controllers\SavedFilterController::class, 'index']);
    Route::post('saved-filters', [\Modules\Task\Http\Controllers\SavedFilterController::class, 'store']);
    Route::delete('saved-filters/{filter}', [\Modules\Task\Http\Controllers\SavedFilterController::class, 'destroy']);
});
