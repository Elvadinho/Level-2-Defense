<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Modules\Customer\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create(['role' => 'employee']);
        $this->actingAs($this->user, 'api');
    }

    public function test_can_get_all_customers()
    {
        Customer::create([
            'company_name' => 'Acme Corp',
            'contact_name' => 'John Doe',
            'email' => 'contact@acmecorp.com',
            'phone' => '1234567890',
            'address' => '123 Acme St',
            'city' => 'Metropolis',
            'country' => 'USA'
        ]);

        $response = $this->getJson('/api/customers');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonPath('0.company_name', 'Acme Corp');
    }

    public function test_can_create_customer()
    {
        $response = $this->postJson('/api/customers', [
            'company_name' => 'Global Tech',
            'contact_name' => 'Jane Smith',
            'email' => 'info@globaltech.com',
            'phone' => '0987654321',
            'address' => '456 Tech Ave',
            'city' => 'Gotham',
            'country' => 'USA'
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('company_name', 'Global Tech');

        $this->assertDatabaseHas('customers', [
            'company_name' => 'Global Tech',
            'contact_name' => 'Jane Smith',
            'email' => 'info@globaltech.com'
        ]);
    }

    public function test_can_get_single_customer()
    {
        $customer = Customer::create([
            'company_name' => 'Acme Corp',
            'contact_name' => 'John Doe',
            'email' => 'contact@acmecorp.com',
            'phone' => '1234567890',
            'address' => '123 Acme St'
        ]);

        $response = $this->getJson("/api/customers/{$customer->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('company_name', 'Acme Corp');
    }

    public function test_can_update_customer()
    {
        $customer = Customer::create([
            'company_name' => 'Old Name',
            'contact_name' => 'Old Contact',
            'email' => 'old@example.com',
            'phone' => '1111111111',
            'address' => 'Old Address'
        ]);

        $response = $this->putJson("/api/customers/{$customer->id}", [
            'company_name' => 'New Name',
            'contact_name' => 'New Contact',
            'email' => 'new@example.com',
            'phone' => '2222222222',
            'address' => 'New Address'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('company_name', 'New Name');

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'company_name' => 'New Name',
            'contact_name' => 'New Contact'
        ]);
    }

    public function test_can_delete_customer()
    {
        $customer = Customer::create([
            'company_name' => 'To Delete',
            'contact_name' => 'Delete Contact',
            'email' => 'delete@example.com',
            'phone' => '3333333333',
            'address' => 'Delete St'
        ]);

        $response = $this->deleteJson("/api/customers/{$customer->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('customers', [
            'id' => $customer->id
        ]);
    }
}
