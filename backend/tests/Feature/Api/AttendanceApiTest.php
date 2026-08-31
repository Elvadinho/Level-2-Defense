<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Modules\Attendance\Models\Attendance;
use Modules\Employee\Models\Department;
use Modules\Employee\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceApiTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $employeeUser;
    private Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->adminUser = User::factory()->create(['role' => 'admin']);
        
        $this->employeeUser = User::factory()->create(['role' => 'employee']);
        
        $department = Department::create(['name' => 'IT', 'description' => 'IT Dept']);
        
        $this->employee = Employee::create([
            'user_id' => $this->employeeUser->id,
            'department_id' => $department->id,
            'job_title' => 'Software Engineer',
            'employment_status' => 'active',
            'hire_date' => '2026-01-01'
        ]);
    }

    public function test_employee_can_check_in()
    {
        $this->actingAs($this->employeeUser, 'api');

        $response = $this->postJson('/api/attendance/check-in', [
            'latitude' => 3.8452,
            'longitude' => 11.4861
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['message', 'attendance']);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => $this->employee->id,
            'check_in_latitude' => 3.8452,
            'check_in_longitude' => 11.4861
        ]);
    }

    public function test_employee_can_check_out()
    {
        $this->actingAs($this->employeeUser, 'api');

        // First check in
        $response1 = $this->postJson('/api/attendance/check-in', [
            'latitude' => 3.8452,
            'longitude' => 11.4861
        ]);
        
        if ($response1->status() !== 201) {
            dump("CHECK IN FAILED:", $response1->json());
        }

        // Then check out
        $response = $this->postJson('/api/attendance/check-out', [
            'latitude' => 3.8453,
            'longitude' => 11.4862
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'attendance']);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => $this->employee->id,
            'check_out_latitude' => 3.8453,
            'check_out_longitude' => 11.4862
        ]);
    }

    public function test_employee_can_view_my_history()
    {
        $this->actingAs($this->employeeUser, 'api');

        Attendance::create([
            'employee_id' => $this->employee->id,
            'date' => now()->toDateString(),
            'check_in_time' => '08:00:00',
            'status' => 'present',
            'check_in_latitude' => 3.8452,
            'check_in_longitude' => 11.4861
        ]);

        $response = $this->getJson('/api/attendance/my-history');

        $response->assertStatus(200)
                 ->assertJsonCount(1);
    }

    public function test_admin_can_view_all_history()
    {
        $this->actingAs($this->adminUser, 'api');

        Attendance::create([
            'employee_id' => $this->employee->id,
            'date' => now()->toDateString(),
            'check_in_time' => '08:00:00',
            'status' => 'present',
            'check_in_latitude' => 3.8452,
            'check_in_longitude' => 11.4861
        ]);

        $response = $this->getJson('/api/attendance');

        $response->assertStatus(200)
                 ->assertJsonCount(1);
    }

    public function test_employee_cannot_view_all_history()
    {
        $this->actingAs($this->employeeUser, 'api');

        $response = $this->getJson('/api/attendance');

        $response->assertStatus(403);
    }

    public function test_admin_can_generate_qr_code()
    {
        $this->actingAs($this->adminUser, 'api');

        $response = $this->getJson('/api/attendance/qr-code');

        $response->assertStatus(200);
        // The QR code returns SVG XML content usually
        $this->assertStringContainsString('svg', $response->getContent());
    }
}
