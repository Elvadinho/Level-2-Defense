<?php

use Illuminate\Support\Facades\Route;
use Modules\Quotation\Http\Controllers\QuotationController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('quotations', QuotationController::class)->names('quotation');
});
