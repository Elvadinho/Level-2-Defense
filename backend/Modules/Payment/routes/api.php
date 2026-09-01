<?php

use Illuminate\Support\Facades\Route;
use Modules\Payment\Http\Controllers\PaymentController;

// Protected routes (require authentication)
Route::middleware(['auth:api'])->group(function () {
    Route::get('payments', [PaymentController::class, 'index']);
    Route::post('payments', [PaymentController::class, 'store']);
    Route::get('payments/{id}', [PaymentController::class, 'show']);
    Route::post('payments/{id}/verify', [PaymentController::class, 'verify']);
});

// Webhook route — NO auth middleware (NotchPay calls this externally)
Route::post('payments/webhook', [PaymentController::class, 'webhook']);
