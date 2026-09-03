<?php

use Illuminate\Support\Facades\Route;
use Modules\AIAssistant\Http\Controllers\AIAssistantController;

Route::middleware(['auth:api'])->group(function () {
    Route::post('assistant/ask', [AIAssistantController::class, 'ask'])->name('assistant.ask');
    Route::post('assistant/confirm', [AIAssistantController::class, 'confirmAction'])->name('assistant.confirm');
    Route::get('assistant/actions', [AIAssistantController::class, 'actions'])->name('assistant.actions');
    Route::get('assistant/history', [AIAssistantController::class, 'history'])->name('assistant.history');
    Route::get('assistant/request/{agentRequest}', [AIAssistantController::class, 'getRequest'])->name('assistant.get-request');
});