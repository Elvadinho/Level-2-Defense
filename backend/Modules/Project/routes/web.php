<?php

use Illuminate\Support\Facades\Route;
use Modules\Project\Http\Controllers\ProjectController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('projects', ProjectController::class)->names('project');
});
