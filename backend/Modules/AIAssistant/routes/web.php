<?php

use Illuminate\Support\Facades\Route;
use Modules\AIAssistant\Http\Controllers\AIAssistantController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('aiassistants', AIAssistantController::class)->names('aiassistant');
});
