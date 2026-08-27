<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Modules\Employee\Models\Department;
use Modules\Employee\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        // Create a user and authenticate
        $this->user = User::factory()->create();
        $this->actingAs($this->user, 'sanctum');
    }

    public function test_can_create_department()
    {
        $response = $this->postJson('/api/departments', [
            'name' => 'IT Department',
            'description' => 'Information Technology'
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('name', 'IT Department');

        $this->assertDatabaseHas('departments', [
            'name' => 'IT Department'
        ]);
    }

    public function test_can_create_employee()
    {
        $department = Department::create(['name' => 'HR']);
        $employeeUser = User::factory()->create();

        $response = $this->postJson('/api/employees', [
            'user_id' => $employeeUser->id,
            'department_id' => $department->id,
            'job_title' => 'HR Manager',
            'hire_date' => '2026-01-01',
            'employment_status' => 'active'
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('job_title', 'HR Manager');
                 
        $this->assertDatabaseHas('employees', [
            'user_id' => $employeeUser->id,
            'job_title' => 'HR Manager'
        ]);
    }
}
