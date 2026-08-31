<?php

use Illuminate\Support\Facades\Route;
use Modules\Payment\Http\Controllers\PaymentController;

Route::middleware(['auth:api'])->prefix('v1')->group(function () {
    Route::apiResource('payments', PaymentController::class)->names('payment');
});
