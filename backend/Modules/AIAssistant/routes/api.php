<?php

use Illuminate\Support\Facades\Route;
use Modules\AIAssistant\Http\Controllers\AIAssistantController;

Route::middleware(['auth:api'])->prefix('v1')->group(function () {
    Route::apiResource('aiassistants', AIAssistantController::class)->names('aiassistant');
});
