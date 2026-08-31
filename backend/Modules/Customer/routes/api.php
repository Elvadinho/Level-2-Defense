<?php

use Illuminate\Support\Facades\Route;
use Modules\Customer\Http\Controllers\CustomerController;

Route::middleware('auth:api')->group(function () {
    Route::apiResource('customers', CustomerController::class);
});
