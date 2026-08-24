<?php

use Illuminate\Support\Facades\Route;
use Modules\Employee\Http\Controllers\EmployeeController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('employees', EmployeeController::class)->names('employee');
});
