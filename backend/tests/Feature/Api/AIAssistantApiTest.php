<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\AIAssistant\Models\AgentRequest;
use Modules\AIAssistant\Services\AssistantService;
use Modules\Authentication\Enums\Role;
use Modules\Employee\Models\Department;
use Modules\Employee\Models\Employee;
use Tests\TestCase;

class AIAssistantApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.nvidia.api_key' => 'test-nvidia-key']);
        $this->user = User::factory()->create(['role' => Role::ADMIN]);
        $this->actingAs($this->user, 'api');
    }

    public function test_build_messages_includes_real_database_employees()
    {
        $dept = Department::create(['name' => 'Engineering', 'description' => 'Software Dev']);
        $empUser = User::factory()->create(['name' => 'Alice Wonderland', 'email' => 'alice@modoo.com']);
        $emp = Employee::create([
            'user_id' => $empUser->id,
            'department_id' => $dept->id,
            'job_title' => 'Lead Architect',
            'hire_date' => '2026-01-01',
            'employment_status' => 'active',
        ]);

        $service = new AssistantService();
        $messages = $service->buildMessages($this->user, 'tell me all the employees');

        $this->assertCount(2, $messages);
        $userMessage = $messages[1]['content'];

        $this->assertStringContainsString('Alice Wonderland', $userMessage);
        $this->assertStringContainsString('alice@modoo.com', $userMessage);
        $this->assertStringContainsString('Lead Architect', $userMessage);
        $this->assertStringContainsString('Engineering', $userMessage);
    }

    public function test_can_ask_assistant_successfully()
    {
        $dept = Department::create(['name' => 'HR', 'description' => 'Human Resources']);
        $empUser = User::factory()->create(['name' => 'Bob Builder', 'email' => 'bob@modoo.com']);
        Employee::create([
            'user_id' => $empUser->id,
            'department_id' => $dept->id,
            'job_title' => 'HR Specialist',
            'hire_date' => '2026-02-01',
            'employment_status' => 'active',
        ]);

        $mockResponse = [
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'intent' => 'query',
                            'explanation' => 'Here are all the current employees in the company: Bob Builder (HR Specialist in HR).',
                            'data' => [
                                'employees' => [
                                    [
                                        'id' => 1,
                                        'name' => 'Bob Builder',
                                        'department' => 'HR',
                                        'job_title' => 'HR Specialist',
                                    ]
                                ]
                            ]
                        ]),
                    ]
                ]
            ],
            'usage' => [
                'total_tokens' => 120,
            ]
        ];

        Http::fake([
            'https://integrate.api.nvidia.com/*' => Http::response($mockResponse, 200),
        ]);

        $response = $this->postJson('/api/assistant/ask', [
            'question' => 'tell me all the employees'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('intent', 'query')
                 ->assertJsonPath('data.employees.0.name', 'Bob Builder');

        $this->assertDatabaseHas('agent_requests', [
            'user_id' => $this->user->id,
            'user_input' => 'tell me all the employees',
            'intent' => 'query',
            'status' => 'done',
        ]);
    }

    public function test_can_get_assistant_history()
    {
        AgentRequest::create([
            'user_id' => $this->user->id,
            'user_input' => 'list all projects',
            'prompt' => '[]',
            'intent' => 'query',
            'status' => 'done',
            'result' => json_encode(['projects' => []]),
        ]);

        $response = $this->getJson('/api/assistant/history');

        $response->assertStatus(200)
                 ->assertJsonPath('data.0.user_input', 'list all projects');
    }

    public function test_parse_response_handles_markdown_code_blocks_and_think_tags()
    {
        $service = new AssistantService();

        $rawLlmOutput = "<think>Analyzing database...</think>\n```json\n{\n  \"intent\": \"query\",\n  \"explanation\": \"Found 1 employee.\",\n  \"data\": {\"count\": 1}\n}\n```";

        $parsed = $service->parseResponse($rawLlmOutput);

        $this->assertTrue($parsed['success']);
        $this->assertEquals('query', $parsed['intent']);
        $this->assertEquals('Found 1 employee.', $parsed['explanation']);
        $this->assertEquals(['count' => 1], $parsed['data']);
    }

    public function test_assistant_can_execute_create_task_action_immediately()
    {
        $dept = Department::create(['name' => 'Tech', 'description' => 'Tech Team']);
        $emp = Employee::create([
            'user_id' => $this->user->id,
            'department_id' => $dept->id,
            'job_title' => 'Tech Lead',
            'hire_date' => '2026-01-01',
        ]);
        $project = \Modules\Project\Models\Project::create([
            'name' => 'AI Core Migration',
            'description' => 'Migrating core features',
            'status' => 'in_progress',
            'manager_id' => $emp->id,
        ]);

        $mockResponse = [
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'intent' => 'action',
                            'explanation' => 'Creating task for database migration...',
                            'action' => [
                                'name' => 'create_task',
                                'params' => [
                                    'project_id' => $project->id,
                                    'title' => 'Write database migrations',
                                    'priority' => 'high',
                                    'assigned_to' => $emp->id,
                                ],
                                'requires_confirmation' => false,
                            ],
                            'data' => [],
                        ]),
                    ]
                ]
            ],
        ];

        Http::fake([
            'https://integrate.api.nvidia.com/*' => Http::response($mockResponse, 200),
        ]);

        $response = $this->postJson('/api/assistant/ask', [
            'question' => 'Create a task Write database migrations in project 1'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'executed')
                 ->assertJsonPath('action', 'create_task')
                 ->assertJsonPath('requires_confirmation', false)
                 ->assertJsonPath('data.task.title', 'Write database migrations');

        $this->assertDatabaseHas('tasks', [
            'project_id' => $project->id,
            'title' => 'Write database migrations',
            'priority' => 'high',
        ]);
    }

    public function test_assistant_can_execute_update_task_status_action()
    {
        $dept = Department::create(['name' => 'Design', 'description' => 'Design Team']);
        $emp = Employee::create([
            'user_id' => $this->user->id,
            'department_id' => $dept->id,
            'job_title' => 'Designer',
            'hire_date' => '2026-01-01',
        ]);
        $project = \Modules\Project\Models\Project::create([
            'name' => 'Website Redesign',
            'status' => 'in_progress',
            'manager_id' => $emp->id,
        ]);
        $task = \Modules\Task\Models\Task::create([
            'project_id' => $project->id,
            'title' => 'Design new homepage mockup',
            'status' => 'todo',
            'priority' => 'medium',
        ]);

        $mockResponse = [
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'intent' => 'action',
                            'explanation' => 'Updating task status to done...',
                            'action' => [
                                'name' => 'update_task_status',
                                'params' => [
                                    'task_id' => $task->id,
                                    'status' => 'done',
                                ],
                                'requires_confirmation' => false,
                            ],
                            'data' => [],
                        ]),
                    ]
                ]
            ],
        ];

        Http::fake([
            'https://integrate.api.nvidia.com/*' => Http::response($mockResponse, 200),
        ]);

        $response = $this->postJson('/api/assistant/ask', [
            'question' => "Change status of task {$task->id} to done"
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'executed')
                 ->assertJsonPath('action', 'update_task_status')
                 ->assertJsonPath('data.new_status', 'done');

        $this->assertEquals('done', $task->fresh()->status->value);
    }

    public function test_assistant_requires_confirmation_for_sensitive_action_such_as_delete_user()
    {
        $victim = User::factory()->create([
            'name' => 'Charlie Danger',
            'email' => 'charlie@danger.com',
            'role' => Role::EMPLOYEE,
        ]);

        $mockResponse = [
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'intent' => 'action',
                            'explanation' => 'Deleting user requires confirmation.',
                            'action' => [
                                'name' => 'delete_user',
                                'params' => [
                                    'user_id' => $victim->id,
                                ],
                                'requires_confirmation' => true,
                            ],
                            'data' => [],
                        ]),
                    ]
                ]
            ],
        ];

        Http::fake([
            'https://integrate.api.nvidia.com/*' => Http::response($mockResponse, 200),
        ]);

        $response = $this->postJson('/api/assistant/ask', [
            'question' => "Delete user {$victim->id}"
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'pending_confirmation')
                 ->assertJsonPath('requires_confirmation', true)
                 ->assertJsonPath('action', 'delete_user');

        // Target user should NOT be deleted yet!
        $this->assertDatabaseHas('users', ['id' => $victim->id]);

        $agentRequestId = $response->json('agent_request_id');

        // Now confirm the sensitive action via endpoint
        $confirmResponse = $this->postJson('/api/assistant/confirm', [
            'agent_request_id' => $agentRequestId,
            'confirm' => true,
        ]);

        $confirmResponse->assertStatus(200)
                        ->assertJsonPath('status', 'executed')
                        ->assertJsonPath('action', 'delete_user')
                        ->assertJsonPath('data.deleted_user_id', $victim->id);

        // Now user should be deleted from DB
        $this->assertDatabaseMissing('users', ['id' => $victim->id]);
    }

    public function test_confirm_endpoint_cancels_pending_action_when_confirm_is_false()
    {
        $victim = User::factory()->create([
            'name' => 'David Safe',
            'email' => 'david@safe.com',
            'role' => Role::EMPLOYEE,
        ]);

        $agentRequest = AgentRequest::create([
            'user_id' => $this->user->id,
            'user_input' => "delete user {$victim->id}",
            'prompt' => '[]',
            'intent' => 'action',
            'status' => 'pending_confirmation',
            'parsed_action' => [
                'name' => 'delete_user',
                'params' => ['user_id' => $victim->id],
                'requires_confirmation' => true,
            ],
        ]);

        $response = $this->postJson('/api/assistant/confirm', [
            'agent_request_id' => $agentRequest->id,
            'confirm' => false,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'cancelled');

        $this->assertDatabaseHas('users', ['id' => $victim->id]);
        $this->assertEquals('cancelled', $agentRequest->fresh()->status);
    }

    public function test_conversational_confirmation_executes_pending_sensitive_action()
    {
        $victim = User::factory()->create([
            'name' => 'Eve Target',
            'email' => 'eve@target.com',
            'role' => Role::EMPLOYEE,
        ]);

        AgentRequest::create([
            'user_id' => $this->user->id,
            'user_input' => "delete user {$victim->id}",
            'prompt' => '[]',
            'intent' => 'action',
            'status' => 'pending_confirmation',
            'parsed_action' => [
                'name' => 'delete_user',
                'params' => ['user_id' => $victim->id],
                'requires_confirmation' => true,
            ],
        ]);

        // User replies with "yes, proceed"
        $response = $this->postJson('/api/assistant/ask', [
            'question' => 'Yes, proceed with deletion'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'executed')
                 ->assertJsonPath('action', 'delete_user');

        $this->assertDatabaseMissing('users', ['id' => $victim->id]);
    }

    public function test_conversational_cancellation_cancels_pending_sensitive_action()
    {
        $victim = User::factory()->create([
            'name' => 'Frank Protected',
            'email' => 'frank@protected.com',
            'role' => Role::EMPLOYEE,
        ]);

        $request = AgentRequest::create([
            'user_id' => $this->user->id,
            'user_input' => "delete user {$victim->id}",
            'prompt' => '[]',
            'intent' => 'action',
            'status' => 'pending_confirmation',
            'parsed_action' => [
                'name' => 'delete_user',
                'params' => ['user_id' => $victim->id],
                'requires_confirmation' => true,
            ],
        ]);

        // User replies with "no, cancel"
        $response = $this->postJson('/api/assistant/ask', [
            'question' => 'No, cancel'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'cancelled');

        $this->assertDatabaseHas('users', ['id' => $victim->id]);
        $this->assertEquals('cancelled', $request->fresh()->status);
    }

    public function test_unauthorized_role_is_rejected_from_sensitive_action()
    {
        $regularEmpUser = User::factory()->create(['role' => Role::EMPLOYEE]);
        $this->actingAs($regularEmpUser, 'api');

        $mockResponse = [
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'intent' => 'action',
                            'explanation' => 'Attempting to delete user',
                            'action' => [
                                'name' => 'delete_user',
                                'params' => ['user_id' => $this->user->id],
                                'requires_confirmation' => true,
                            ],
                            'data' => [],
                        ]),
                    ]
                ]
            ],
        ];

        Http::fake([
            'https://integrate.api.nvidia.com/*' => Http::response($mockResponse, 200),
        ]);

        $response = $this->postJson('/api/assistant/ask', [
            'question' => "Delete user {$this->user->id}"
        ]);

        $response->assertStatus(403)
                 ->assertJsonPath('status', 'forbidden')
                 ->assertJsonPath('action', 'delete_user');
    }

    public function test_can_get_assistant_actions_list()
    {
        $response = $this->getJson('/api/assistant/actions');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'actions' => [
                         'create_task',
                         'update_task_status',
                         'delete_task',
                         'delete_user',
                     ]
                 ]);
    }
}
