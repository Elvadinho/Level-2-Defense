<?php

use Illuminate\Support\Facades\Route;
use Modules\Invoice\Http\Controllers\InvoiceController;

Route::middleware(['auth:api'])->prefix('v1')->group(function () {
    Route::apiResource('invoices', InvoiceController::class)->names('invoice');
});
