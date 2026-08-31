<?php

use Illuminate\Support\Facades\Route;
use Modules\Employee\Http\Controllers\DepartmentController;
use Modules\Employee\Http\Controllers\EmployeeController;

Route::middleware('auth:api')->group(function () {
    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('employees', EmployeeController::class);
});
