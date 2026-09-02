<?php

use Illuminate\Support\Facades\Route;
use Modules\Notification\Http\Controllers\Api\NotificationController as ApiNotificationController;

Route::middleware(['auth:api'])->prefix('v1')->group(function () {
    // RESTful resource
    Route::get('notifications', [ApiNotificationController::class, 'index'])->name('notification.index');
    Route::get('notifications/{notification}', [ApiNotificationController::class, 'show'])->name('notification.show');
    Route::delete('notifications/{notification}', [ApiNotificationController::class, 'destroy'])->name('notification.destroy');

    // Custom endpoints
    Route::get('notifications/unread/count', [ApiNotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::post('notifications/{notification}/read', [ApiNotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::post('notifications/read-all', [ApiNotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');
    Route::delete('notifications/delete-all', [ApiNotificationController::class, 'destroyAll'])->name('notifications.destroy-all');
});
