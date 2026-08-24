<?php

use Illuminate\Support\Facades\Route;
use Modules\Authentication\Http\Controllers\AuthenticationController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('authentications', AuthenticationController::class)->names('authentication');
});
