<?php

use Illuminate\Support\Facades\Route;
use Modules\Attendance\Http\Controllers\AttendanceController;

/*
|--------------------------------------------------------------------------
| Attendance API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->prefix('attendance')->group(function () {
    // Employee actions (from QR code scan)
    Route::post('/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('/my-history', [AttendanceController::class, 'myHistory']);

    // Admin / HR actions
    Route::get('/', [AttendanceController::class, 'index']);
    Route::get('/history/{employeeId}', [AttendanceController::class, 'history']);
    Route::get('/qr-code', [AttendanceController::class, 'generateQrCode']);
});
