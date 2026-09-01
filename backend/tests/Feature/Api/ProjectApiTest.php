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
    public function test_can_list_projects()
    {
        \Modules\Project\Models\Project::create([
            'name' => 'Project A',
            'manager_id' => $this->manager->id,
            'status' => 'planning'
        ]);

        $response = $this->getJson('/api/projects');

        $response->assertStatus(200)
                 ->assertJsonCount(1);
    }

    public function test_can_get_single_project()
    {
        $project = \Modules\Project\Models\Project::create([
            'name' => 'Project A',
            'manager_id' => $this->manager->id,
            'status' => 'planning'
        ]);

        $response = $this->getJson("/api/projects/{$project->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('name', 'Project A');
    }

    public function test_can_update_project()
    {
        $project = \Modules\Project\Models\Project::create([
            'name' => 'Project A',
            'manager_id' => $this->manager->id,
            'status' => 'planning'
        ]);

        $response = $this->putJson("/api/projects/{$project->id}", [
            'name' => 'Project A',
            'manager_id' => $this->manager->id,
            'status' => 'in_progress'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'in_progress');

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'status' => 'in_progress']);
    }

    public function test_can_delete_project()
    {
        $project = \Modules\Project\Models\Project::create([
            'name' => 'Project A',
            'manager_id' => $this->manager->id,
            'status' => 'planning'
        ]);

        $response = $this->deleteJson("/api/projects/{$project->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_can_add_and_list_members()
    {
        $project = \Modules\Project\Models\Project::create([
            'name' => 'Project A',
            'manager_id' => $this->manager->id,
            'status' => 'planning'
        ]);

        $employeeUser = User::factory()->create();
        $department = Department::create(['name' => 'IT']);
        $employee = Employee::create([
            'user_id' => $employeeUser->id,
            'department_id' => $department->id,
            'job_title' => 'Dev',
            'hire_date' => '2026-01-01',
        ]);

        $response = $this->postJson("/api/projects/{$project->id}/members", [
            'employee_id' => $employee->id,
            'role' => 'developer'
        ]);

        $response->assertStatus(201);

        $responseList = $this->getJson("/api/projects/{$project->id}/members");
        $responseList->assertStatus(200);
    }
}
