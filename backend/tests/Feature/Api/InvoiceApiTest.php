<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Modules\Customer\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceApiTest extends TestCase
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

    public function test_can_create_invoice()
    {
        $response = $this->postJson('/api/invoices', [
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-001',
            'issue_date' => '2026-09-01',
            'due_date' => '2026-09-15',
            'tax_rate' => 10.00,
            'notes' => 'Thank you for your business!',
            'items' => [
                [
                    'service_category' => 'Development',
                    'description' => 'Frontend Development',
                    'quantity' => 10,
                    'unit' => 'Hours',
                    'unit_price' => 50.00
                ]
            ]
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('subtotal', 500)
                 ->assertJsonPath('tax_amount', 50)
                 ->assertJsonPath('total_amount', 550)
                 ->assertJsonPath('invoice_number', 'INV-2026-001');

        $this->assertDatabaseHas('invoices', [
            'customer_id' => $this->customer->id,
            'total_amount' => 550,
            'status' => 'unpaid'
        ]);

        $this->assertDatabaseHas('invoice_items', [
            'service_category' => 'Development',
            'unit_price' => 50.00
        ]);
    }

    public function test_can_list_invoices()
    {
        \Modules\Invoice\Models\Invoice::create([
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-002',
            'issue_date' => '2026-09-01',
            'due_date' => '2026-09-15',
            'subtotal' => 1000,
            'tax_amount' => 100,
            'total_amount' => 1100,
            'status' => 'unpaid'
        ]);

        $response = $this->getJson('/api/invoices');

        $response->assertStatus(200)
                 ->assertJsonCount(1);
    }

    public function test_can_get_single_invoice()
    {
        $invoice = \Modules\Invoice\Models\Invoice::create([
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-002',
            'issue_date' => '2026-09-01',
            'due_date' => '2026-09-15',
            'subtotal' => 1000,
            'tax_amount' => 100,
            'total_amount' => 1100,
            'status' => 'unpaid'
        ]);

        $response = $this->getJson("/api/invoices/{$invoice->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('total_amount', 1100);
    }

    public function test_can_update_invoice_status()
    {
        $invoice = \Modules\Invoice\Models\Invoice::create([
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-002',
            'issue_date' => '2026-09-01',
            'due_date' => '2026-09-15',
            'subtotal' => 1000,
            'tax_amount' => 100,
            'total_amount' => 1100,
            'status' => 'unpaid'
        ]);

        $response = $this->putJson("/api/invoices/{$invoice->id}", [
            'status' => 'paid'
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'paid');

        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'paid']);
    }

    public function test_can_delete_invoice()
    {
        $invoice = \Modules\Invoice\Models\Invoice::create([
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-002',
            'issue_date' => '2026-09-01',
            'due_date' => '2026-09-15',
            'subtotal' => 1000,
            'tax_amount' => 100,
            'total_amount' => 1100,
            'status' => 'unpaid'
        ]);

        $response = $this->deleteJson("/api/invoices/{$invoice->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('invoices', ['id' => $invoice->id]);
    }
}
