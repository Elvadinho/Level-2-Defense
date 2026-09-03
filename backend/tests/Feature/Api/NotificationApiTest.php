<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Modules\Notification\Models\Notification;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'password' => bcrypt('password'),
        ]);
    }

    private function authHeaders(User $user): array
    {
        $res = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $token = $res->json('token');

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_get_notifications_index()
    {
        Notification::factory()->for($this->user)->count(5)->create();

        $response = $this->withHeaders($this->authHeaders($this->user))
            ->getJson('/api/v1/notifications');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'user_id', 'type', 'title', 'body', 'read_at', 'created_at'],
                ],
                'pagination',
            ]);
    }

    public function test_get_unread_count()
    {
        Notification::factory()->for($this->user)->count(3)->create(['read_at' => null]);
        Notification::factory()->for($this->user)->count(2)->create(['read_at' => now()]);

        $response = $this->withHeaders($this->authHeaders($this->user))
            ->getJson('/api/v1/notifications/unread/count');

        $response->assertOk()->assertJson(['unread_count' => 3]);
    }

    public function test_show_notification()
    {
        $notification = Notification::factory()->for($this->user)->create();

        $response = $this->withHeaders($this->authHeaders($this->user))
            ->getJson("/api/v1/notifications/{$notification->id}");

        $response->assertOk()->assertJsonPath('data.id', $notification->id);
    }

    public function test_show_notification_unauthorized()
    {
        $otherUser = User::factory()->create(['password' => bcrypt('password')]);
        $notification = Notification::factory()->for($otherUser)->create();

        $response = $this->withHeaders($this->authHeaders($this->user))
            ->getJson("/api/v1/notifications/{$notification->id}");

        $response->assertForbidden();
    }

    public function test_mark_as_read()
    {
        $notification = Notification::factory()->for($this->user)->create(['read_at' => null]);

        $response = $this->withHeaders($this->authHeaders($this->user))
            ->postJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertOk();
        $this->assertNotNull($response->json('data.read_at'));
        $this->assertNotNull($notification->refresh()->read_at);
    }

    public function test_mark_all_as_read()
    {
        Notification::factory()->for($this->user)->count(5)->create(['read_at' => null]);

        $response = $this->withHeaders($this->authHeaders($this->user))
            ->postJson('/api/v1/notifications/read-all');

        $response->assertOk();

        $unread = Notification::where('user_id', $this->user->id)->whereNull('read_at')->count();

        $this->assertEquals(0, $unread);
    }

    public function test_delete_notification()
    {
        $notification = Notification::factory()->for($this->user)->create();

        $response = $this->withHeaders($this->authHeaders($this->user))
            ->deleteJson("/api/v1/notifications/{$notification->id}");

        $response->assertNoContent();
        $this->assertNull(Notification::find($notification->id));
    }

    public function test_delete_all_notifications()
    {
        Notification::factory()->for($this->user)->count(5)->create();

        $response = $this->withHeaders($this->authHeaders($this->user))
            ->deleteJson('/api/v1/notifications/delete-all');

        $response->assertOk();

        $count = Notification::where('user_id', $this->user->id)->count();
        $this->assertEquals(0, $count);
    }

    public function test_unauthenticated_cannot_access()
    {
        $response = $this->getJson('/api/v1/notifications');

        $response->assertUnauthorized();
    }
}
