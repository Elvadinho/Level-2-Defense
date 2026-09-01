<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Modules\Customer\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuotationApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->actingAs($this->user, 'api');

        $this->customer = Customer::create([
            'user_id' => $this->user->id,
            'company_name' => 'TechNova Solutions',
            'contact_name' => 'Jane Smith',
            'email' => 'jane@technova.com'
        ]);
    }

    public function test_can_create_digital_solution_quotation()
    {
        $response = $this->postJson('/api/quotations', [
            'customer_id' => $this->customer->id,
            'project_name' => 'AI Customer Support Chatbot',
            'project_type' => 'AI Automation',
            'technology_stack' => json_encode(['Python', 'LangChain', 'React']),
            'estimated_duration' => '6 Weeks',
            'quotation_date' => '2026-09-01',
            'valid_until' => '2026-09-30',
            'notes' => 'Includes 1 month of free post-launch support.',
            'items' => [
                [
                    'service_category' => 'Development',
                    'description' => 'LLM Integration and Backend Logic',
                    'quantity' => 120,
                    'unit' => 'Hours',
                    'unit_price' => 75.00
                ],
                [
                    'service_category' => 'Design',
                    'description' => 'Chatbot UI/UX Design',
                    'quantity' => 1,
                    'unit' => 'Flat Rate',
                    'unit_price' => 1500.00
                ]
            ]
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('total_amount', 10500)
                 ->assertJsonPath('project_name', 'AI Customer Support Chatbot');

        $this->assertDatabaseHas('quotations', [
            'customer_id' => $this->customer->id,
            'total_amount' => 10500,
            'project_type' => 'AI Automation'
        ]);

        $this->assertDatabaseHas('quotation_items', [
            'service_category' => 'Development',
            'unit' => 'Hours',
            'unit_price' => 75.00
        ]);
    }

    public function test_can_list_quotations()
    {
        \Modules\Quotation\Models\Quotation::create([
            'customer_id' => $this->customer->id,
            'project_name' => 'E-Commerce Website',
            'project_type' => 'Web Development',
            'estimated_duration' => '2 Months',
            'quotation_date' => '2026-09-01',
            'valid_until' => '2026-09-30',
            'total_amount' => 5000.00,
            'status' => 'draft'
        ]);

        $response = $this->getJson('/api/quotations');

        $response->assertStatus(200)
                 ->assertJsonCount(1);
    }

    public function test_can_get_single_quotation()
    {
        $quotation = \Modules\Quotation\Models\Quotation::create([
            'customer_id' => $this->customer->id,
            'project_name' => 'E-Commerce Website',
            'project_type' => 'Web Development',
            'estimated_duration' => '2 Months',
            'quotation_date' => '2026-09-01',
            'valid_until' => '2026-09-30',
            'total_amount' => 5000.00,
            'status' => 'draft'
        ]);

        $response = $this->getJson("/api/quotations/{$quotation->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('total_amount', 5000);
    }

    public function test_can_update_quotation_status()
    {
        $quotation = \Modules\Quotation\Models\Quotation::create([
            'customer_id' => $this->customer->id,
            'project_name' => 'E-Commerce Website',
            'project_type' => 'Web Development',
            'estimated_duration' => '2 Months',
            'quotation_date' => '2026-09-01',
            'valid_until' => '2026-09-30',
            'total_amount' => 5000.00,
            'status' => 'draft'
        ]);

        $response = $this->putJson("/api/quotations/{$quotation->id}", [
            'status' => 'sent'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'sent');

        $this->assertDatabaseHas('quotations', ['id' => $quotation->id, 'status' => 'sent']);
    }

    public function test_can_delete_quotation()
    {
        $quotation = \Modules\Quotation\Models\Quotation::create([
            'customer_id' => $this->customer->id,
            'project_name' => 'E-Commerce Website',
            'project_type' => 'Web Development',
            'estimated_duration' => '2 Months',
            'quotation_date' => '2026-09-01',
            'valid_until' => '2026-09-30',
            'total_amount' => 5000.00,
            'status' => 'draft'
        ]);

        $response = $this->deleteJson("/api/quotations/{$quotation->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('quotations', ['id' => $quotation->id]);
    }
}
