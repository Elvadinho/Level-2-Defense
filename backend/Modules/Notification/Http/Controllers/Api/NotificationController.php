<?php

namespace Modules\Notification\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Notification\Services\NotificationService;
use Modules\Notification\Models\Notification;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $notifications = $this->notificationService->getNotifications(
            $request->user(),
            $request->input('per_page', 15)
        );

        return response()->json([
            'data' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'total' => $notifications->total(),
                'per_page' => $notifications->perPage(),
                'last_page' => $notifications->lastPage(),
            ],
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->notificationService->countUnread($request->user());

        return response()->json(['unread_count' => $count]);
    }

    public function show(Request $request, Notification $notification): JsonResponse
    {
        if ($request->user()->id !== $notification->user_id) {
            abort(403);
        }

        return response()->json(['data' => $notification]);
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        if ($request->user()->id !== $notification->user_id) {
            abort(403);
        }

        $this->notificationService->markAsRead($notification);

        return response()->json(['message' => 'Notification marked as read', 'data' => $notification->refresh()]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $this->notificationService->markAllAsRead($request->user());

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        if ($request->user()->id !== $notification->user_id) {
            abort(403);
        }

        $this->notificationService->delete($notification);

        return response()->json([], 204);
    }

    public function destroyAll(Request $request): JsonResponse
    {
        $this->notificationService->deleteAll($request->user());

        return response()->json(['message' => 'All notifications deleted']);
    }
}
