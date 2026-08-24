<?php

use Illuminate\Support\Facades\Route;
use Modules\Invoice\Http\Controllers\InvoiceController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('invoices', InvoiceController::class)->names('invoice');
});
