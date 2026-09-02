<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Modules\Notification\Models\Notification;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_notifications_index()
    {
        $user = User::factory()->create();
        $token = auth('api')->login($user);

        Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'New task',
            'body' => 'You were assigned a task',
            'data' => json_encode(['task_id' => 1]),
            'channel' => 'in_app',
        ]);

        Notification::create([
            'user_id' => $user->id,
            'type' => 'project_assigned',
            'title' => 'Project assigned',
            'body' => 'You joined a project',
            'data' => json_encode(['project_id' => 2]),
            'channel' => 'email',
        ]);

        $response = $this->getJson('/api/v1/notifications', [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'user_id', 'type', 'title', 'body', 'read_at', 'created_at'],
                ],
                'pagination',
            ]);
    }

    public function test_unread_count_and_mark_read()
    {
        $user = User::factory()->create();
        $token = auth('api')->login($user);

        $n1 = Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assigned',
            'title' => 'Task',
            'body' => 'Task body',
            'channel' => 'in_app',
        ]);

        $n2 = Notification::create([
            'user_id' => $user->id,
            'type' => 'task_comment',
            'title' => 'Comment',
            'body' => 'Comment body',
            'channel' => 'in_app',
            'read_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/notifications/unread/count', [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $response->assertStatus(200)->assertJson(['unread_count' => 1]);

        $res = $this->postJson("/api/v1/notifications/{$n1->id}/read", [], ['Authorization' => 'Bearer ' . $token]);
        $res->assertStatus(200)->assertJsonPath('data.read_at', Notification::find($n1->id)->read_at->toJSON());
    }

    public function test_destroy_and_destroy_all()
    {
        $user = User::factory()->create();
        $token = auth('api')->login($user);

        $n = Notification::create([
            'user_id' => $user->id,
            'type' => 'task',
            'title' => 'T',
            'body' => 'B',
            'channel' => 'in_app',
        ]);

        $res = $this->deleteJson("/api/v1/notifications/{$n->id}", [], ['Authorization' => 'Bearer ' . $token]);
        $res->assertStatus(204);

        Notification::create([
            'user_id' => $user->id,
            'type' => 'a',
            'title' => 't',
            'body' => 'b',
            'channel' => 'in_app',
        ]);

        $res2 = $this->deleteJson('/api/v1/notifications/delete-all', [], ['Authorization' => 'Bearer ' . $token]);
        $res2->assertStatus(200);

        $this->assertEquals(0, Notification::where('user_id', $user->id)->count());
    }
}
