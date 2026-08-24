<?php

use Illuminate\Support\Facades\Route;
use Modules\Task\Http\Controllers\TaskController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('tasks', TaskController::class)->names('task');
});
