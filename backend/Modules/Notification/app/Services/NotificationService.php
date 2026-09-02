<?php

namespace Modules\Notification\Services;

use Modules\Notification\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class NotificationService
{
    // Types that should default to email channel
    private const EMAIL_TYPES = [
        'department_assigned',
        'project_assigned',
        'account_important',
    ];

    public function send(
        User $user,
        string $type,
        string $title,
        string $body,
        array $data = [],
        ?string $channel = null
    ): Notification {
        $channel = $channel ?? (in_array($type, self::EMAIL_TYPES, true) ? 'email' : 'in_app');

        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'channel' => $channel,
        ]);

        // Dispatch email job only if an email channel is required and a job class exists
        if ($channel !== 'in_app' && class_exists(\Modules\Notification\Jobs\SendNotificationEmailJob::class)) {
            \Modules\Notification\Jobs\SendNotificationEmailJob::dispatch($notification);
        }

        return $notification;
    }

    public function sendToUsers(
        array $userIds,
        string $type,
        string $title,
        string $body,
        array $data = [],
        ?string $channel = null
    ): Collection {
        $users = User::whereIn('id', $userIds)->get();

        return $users->map(function (User $user) use ($type, $title, $body, $data, $channel) {
            return $this->send($user, $type, $title, $body, $data, $channel);
        });
    }

    public function getUnread(User $user, int $limit = 50): Collection
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->recent()
            ->limit($limit)
            ->get();
    }

    public function getNotifications(User $user, int $perPage = 15)
    {
        return Notification::where('user_id', $user->id)
            ->recent()
            ->paginate($perPage);
    }

    public function countUnread(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->count();
    }

    public function markAsRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    public function markAllAsRead(User $user): void
    {
        Notification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);
    }

    public function delete(Notification $notification): bool
    {
        return $notification->delete();
    }

    public function deleteAll(User $user): int
    {
        return Notification::where('user_id', $user->id)->delete();
    }
}
