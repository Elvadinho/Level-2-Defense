<?php

namespace Modules\Notification\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Notification\Models\Notification;
use App\Models\User;

class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => $this->faker->randomElement([
                'task_assigned',
                'invoice_created',
                'payment_received',
                'project_updated',
                'system_alert',
            ]),
            'title' => $this->faker->sentence(),
            'body' => $this->faker->paragraph(),
            'data' => ['related_id' => $this->faker->uuid()],
            'channel' => 'in_app',
            'read_at' => null,
        ];
    }

    public function unread(): static
    {
        return $this->state(['read_at' => null]);
    }

    public function read(): static
    {
        return $this->state(['read_at' => now()]);
    }
}
