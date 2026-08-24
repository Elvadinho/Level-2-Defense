<?php

use Illuminate\Support\Facades\Route;
use Modules\Customer\Http\Controllers\CustomerController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('customers', CustomerController::class)->names('customer');
});
