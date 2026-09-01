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
        $this->actingAs($this->user, 'api');
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
    public function test_can_list_departments()
    {
        Department::create(['name' => 'HR', 'description' => 'Human Resources']);
        Department::create(['name' => 'IT', 'description' => 'Information Technology']);

        $response = $this->getJson('/api/departments');

        $response->assertStatus(200)
                 ->assertJsonCount(2);
    }

    public function test_can_get_single_department()
    {
        $department = Department::create(['name' => 'HR']);

        $response = $this->getJson("/api/departments/{$department->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('name', 'HR');
    }

    public function test_can_update_department()
    {
        $department = Department::create(['name' => 'Old Name']);

        $response = $this->putJson("/api/departments/{$department->id}", [
            'name' => 'New Name'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('name', 'New Name');

        $this->assertDatabaseHas('departments', ['id' => $department->id, 'name' => 'New Name']);
    }

    public function test_can_delete_department()
    {
        $department = Department::create(['name' => 'To Be Deleted']);

        $response = $this->deleteJson("/api/departments/{$department->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('departments', ['id' => $department->id]);
    }

    public function test_can_list_employees()
    {
        $department = Department::create(['name' => 'HR']);
        $employeeUser = User::factory()->create();
        Employee::create([
            'user_id' => $employeeUser->id,
            'department_id' => $department->id,
            'job_title' => 'HR Manager',
            'hire_date' => '2026-01-01',
            'employment_status' => 'active'
        ]);

        $response = $this->getJson('/api/employees');

        $response->assertStatus(200)
                 ->assertJsonCount(1);
    }

    public function test_can_get_single_employee()
    {
        $department = Department::create(['name' => 'HR']);
        $employeeUser = User::factory()->create();
        $employee = Employee::create([
            'user_id' => $employeeUser->id,
            'department_id' => $department->id,
            'job_title' => 'HR Manager',
            'hire_date' => '2026-01-01',
            'employment_status' => 'active'
        ]);

        $response = $this->getJson("/api/employees/{$employee->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('job_title', 'HR Manager');
    }

    public function test_can_update_employee()
    {
        $department = Department::create(['name' => 'HR']);
        $employeeUser = User::factory()->create();
        $employee = Employee::create([
            'user_id' => $employeeUser->id,
            'department_id' => $department->id,
            'job_title' => 'HR Manager',
            'hire_date' => '2026-01-01',
            'employment_status' => 'active'
        ]);

        $response = $this->putJson("/api/employees/{$employee->id}", [
            'user_id' => $employeeUser->id,
            'department_id' => $department->id,
            'job_title' => 'HR Director',
            'hire_date' => '2026-01-01',
            'employment_status' => 'active'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('job_title', 'HR Director');

        $this->assertDatabaseHas('employees', ['id' => $employee->id, 'job_title' => 'HR Director']);
    }

    public function test_can_delete_employee()
    {
        $department = Department::create(['name' => 'HR']);
        $employeeUser = User::factory()->create();
        $employee = Employee::create([
            'user_id' => $employeeUser->id,
            'department_id' => $department->id,
            'job_title' => 'HR Manager',
            'hire_date' => '2026-01-01',
            'employment_status' => 'active'
        ]);

        $response = $this->deleteJson("/api/employees/{$employee->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('employees', ['id' => $employee->id]);
    }
}
