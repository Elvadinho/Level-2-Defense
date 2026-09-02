<?php

namespace Modules\Notification\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Modules\Notification\Models\Notification;
use Illuminate\Support\Facades\Log;

class SendNotificationEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function __construct(public Notification $notification) {}

    public function handle(): void
    {
        // Minimal safe implementation: attempt to send if mail config exists
        try {
            if (config('mail.default')) {
                // Prefer a Mailable if available
                if (class_exists('\Modules\Notification\Mail\NotificationMail')) {
                    \Illuminate\Support\Facades\Mail::to($this->notification->user->email)
                        ->queue(new \Modules\Notification\Mail\NotificationMail($this->notification));
                } else {
                    // Fallback: log the intended email
                    Log::info('SendNotificationEmailJob: would send email', [
                        'to' => $this->notification->user->email,
                        'title' => $this->notification->title,
                        'body' => $this->notification->body,
                    ]);
                }

                $this->notification->update(['sent_at' => now()]);
            }
        } catch (\Throwable $e) {
            $this->notification->update(['error_log' => $e->getMessage()]);
        }
    }
}
