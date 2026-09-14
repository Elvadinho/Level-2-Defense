<?php

namespace Modules\Notification\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Modules\Notification\Models\Notification;
use Illuminate\Support\Facades\Mail;

class SendNotificationEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function __construct(public Notification $notification) {}

    public function handle(): void
    {
        // Minimal safe implementation: attempt to send if mail config exists
        try {
            if (config('mail.default') && $this->notification->user?->email) {
                Mail::raw($this->notification->body, function ($message) {
                    $message->to($this->notification->user->email)
                        ->subject($this->notification->title);
                });
                $this->notification->update(['sent_at' => now()]);
            }
        } catch (\Throwable $e) {
            $this->notification->update(['error_log' => $e->getMessage()]);
        }
    }
}
