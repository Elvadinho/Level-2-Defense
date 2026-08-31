<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Modules\Employee\Models\Department;
use Modules\Employee\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Employee $manager;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->actingAs($this->user, 'api');

        $department = Department::create(['name' => 'Engineering']);
        $this->manager = Employee::create([
            'user_id' => $this->user->id,
            'department_id' => $department->id,
            'job_title' => 'Project Manager',
            'hire_date' => '2026-01-01',
        ]);
    }

    public function test_can_create_project()
    {
        $response = $this->postJson('/api/projects', [
            'name' => 'New ERP Project',
            'description' => 'Test project',
            'status' => 'planning',
            'manager_id' => $this->manager->id
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('name', 'New ERP Project');

        $this->assertDatabaseHas('projects', [
            'name' => 'New ERP Project',
            'manager_id' => $this->manager->id
        ]);
    }
}
