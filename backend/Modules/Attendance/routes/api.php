<?php

use Illuminate\Support\Facades\Route;
use Modules\Attendance\Http\Controllers\AttendanceController;

/*
|--------------------------------------------------------------------------
| Attendance API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:api')->prefix('attendance')->group(function () {
    // Employee actions (from QR code scan)
    Route::post('/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('/my-history', [AttendanceController::class, 'myHistory']);

    // Remote Check-in
    Route::post('/remote-check-in', [AttendanceController::class, 'remoteCheckIn']);

    // Admin / HR actions
    Route::get('/', [AttendanceController::class, 'index']);
    Route::get('/history/{employeeId}', [AttendanceController::class, 'history']);
    Route::get('/qr-code', [AttendanceController::class, 'generateQRCode']);

    // Admin / HR Remote Check-in Management
    Route::get('/remote-requests', [AttendanceController::class, 'pendingRemoteRequests']);
    Route::post('/remote-requests/{id}/approve', [AttendanceController::class, 'approveRemoteRequest']);
    Route::post('/remote-requests/{id}/reject', [AttendanceController::class, 'rejectRemoteRequest']);

    // Admin / HR Remote Authorization Toggle
    Route::post('/toggle-remote-auth/{userId}', [AttendanceController::class, 'toggleRemoteAuthorization']);

    // Export
    Route::get('/export-csv', [AttendanceController::class, 'exportCsv']);
});
