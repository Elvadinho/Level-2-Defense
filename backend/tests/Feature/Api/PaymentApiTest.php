<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Modules\Customer\Models\Customer;
use Modules\Invoice\Models\Invoice;
use Modules\Payment\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymentApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Customer $customer;
    private Invoice $invoice;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user, 'api');

        $this->customer = Customer::create([
            'user_id' => $this->user->id,
            'company_name' => 'TechNova Solutions',
            'contact_name' => 'Jane Smith',
            'email' => 'jane@technova.com',
            'phone' => '+237690000000',
        ]);

        $this->invoice = Invoice::create([
            'customer_id' => $this->customer->id,
            'invoice_number' => 'INV-2026-001',
            'issue_date' => '2026-09-01',
            'due_date' => '2026-09-15',
            'subtotal' => 500000,
            'tax_amount' => 50000,
            'total_amount' => 550000,
            'status' => 'unpaid',
        ]);
    }

    public function test_can_initiate_mtn_momo_payment()
    {
        // Mock NotchPay API responses
        Http::fake([
            'api.notchpay.co/payments' => Http::response([
                'status' => 'Accepted',
                'transaction' => [
                    'reference' => 'tr.notchpay-mtn-123',
                    'merchant_reference' => 'PAY-TESTREF12345',
                    'status' => 'pending',
                    'amount' => 550000,
                    'currency' => 'XAF',
                ],
            ], 201),
            'api.notchpay.co/payments/tr.notchpay-mtn-123' => Http::response([
                'status' => 'Accepted',
                'transaction' => [
                    'reference' => 'tr.notchpay-mtn-123',
                    'status' => 'processing',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/payments', [
            'invoice_id' => $this->invoice->id,
            'channel' => 'cm.mtn',
            'phone' => '+237680000000',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('channel', 'cm.mtn')
                 ->assertJsonPath('status', 'processing');

        $this->assertDatabaseHas('payments', [
            'invoice_id' => $this->invoice->id,
            'channel' => 'cm.mtn',
            'phone' => '+237680000000',
            'status' => 'processing',
            'notchpay_trx_ref' => 'tr.notchpay-mtn-123',
        ]);

        Http::assertSent(function ($request) {
            return $request->method() === 'PUT'
                && str_contains($request->url(), '/payments/tr.notchpay-mtn-123');
        });
    }

    public function test_can_initiate_orange_money_payment()
    {
        Http::fake([
            'api.notchpay.co/payments' => Http::response([
                'status' => 'Accepted',
                'transaction' => [
                    'reference' => 'tr.notchpay-orange-456',
                    'merchant_reference' => 'PAY-TESTREF67890',
                    'status' => 'pending',
                    'amount' => 550000,
                    'currency' => 'XAF',
                ],
            ], 201),
            'api.notchpay.co/payments/tr.notchpay-orange-456' => Http::response([
                'status' => 'Accepted',
                'transaction' => [
                    'reference' => 'tr.notchpay-orange-456',
                    'status' => 'processing',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/payments', [
            'invoice_id' => $this->invoice->id,
            'channel' => 'cm.orange',
            'phone' => '+237690000000',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('channel', 'cm.orange')
                 ->assertJsonPath('status', 'processing');

        $this->assertDatabaseHas('payments', [
            'channel' => 'cm.orange',
            'status' => 'processing',
        ]);
    }

    public function test_can_list_payments()
    {
        Payment::create([
            'invoice_id' => $this->invoice->id,
            'customer_id' => $this->customer->id,
            'notchpay_reference' => 'PAY-LIST123',
            'amount' => 550000,
            'currency' => 'XAF',
            'channel' => 'cm.mtn',
            'phone' => '+237680000000',
            'status' => 'complete',
        ]);

        $response = $this->getJson('/api/payments');

        $response->assertStatus(200)
                 ->assertJsonCount(1);
    }

    public function test_can_get_single_payment()
    {
        $payment = Payment::create([
            'invoice_id' => $this->invoice->id,
            'customer_id' => $this->customer->id,
            'notchpay_reference' => 'PAY-SHOW123',
            'amount' => 550000,
            'currency' => 'XAF',
            'channel' => 'cm.orange',
            'phone' => '+237690000000',
            'status' => 'pending',
        ]);

        $response = $this->getJson("/api/payments/{$payment->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('notchpay_reference', 'PAY-SHOW123')
                 ->assertJsonPath('channel', 'cm.orange');
    }

    public function test_can_verify_payment_status()
    {
        $payment = Payment::create([
            'invoice_id' => $this->invoice->id,
            'customer_id' => $this->customer->id,
            'notchpay_reference' => 'PAY-VERIFY123',
            'notchpay_trx_ref' => 'tr.notchpay-verify-123',
            'amount' => 550000,
            'currency' => 'XAF',
            'channel' => 'cm.mtn',
            'phone' => '+237680000000',
            'status' => 'processing',
        ]);

        // Mock the verify endpoint to return 'complete'
        Http::fake([
            'api.notchpay.co/payments/tr.notchpay-verify-123' => Http::response([
                'transaction' => [
                    'reference' => 'tr.notchpay-verify-123',
                    'status' => 'complete',
                ],
            ], 200),
        ]);

        $response = $this->postJson("/api/payments/{$payment->id}/verify");

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'complete');

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'complete',
        ]);

        // Invoice should also be marked as paid
        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => 'paid',
        ]);
    }

    public function test_webhook_updates_payment_status()
    {
        $payment = Payment::create([
            'invoice_id' => $this->invoice->id,
            'customer_id' => $this->customer->id,
            'notchpay_reference' => 'PAY-WEBHOOK123',
            'notchpay_trx_ref' => 'tr.notchpay-webhook-123',
            'amount' => 550000,
            'currency' => 'XAF',
            'channel' => 'cm.mtn',
            'phone' => '+237680000000',
            'status' => 'processing',
        ]);

        // Compute the correct HMAC signature for the webhook payload
        $payload = json_encode([
            'event' => 'payment.complete',
            'data' => [
                'reference' => 'PAY-WEBHOOK123',
                'status' => 'complete',
                'amount' => 550000,
            ],
        ]);

        $signature = hash_hmac('sha256', $payload, config('notchpay.hash_key'));

        $response = $this->postJson('/api/payments/webhook', json_decode($payload, true), [
            'x-notch-signature' => $signature,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'complete',
        ]);

        // Invoice should be auto-updated to 'paid'
        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => 'paid',
        ]);
    }

    public function test_can_initiate_visa_card_payment()
    {
        Http::fake([
            'api.notchpay.co/payments' => Http::response([
                'status' => 'Accepted',
                'authorization_url' => 'https://pay.notchpay.co/pay_card_abc',
                'transaction' => [
                    'reference' => 'tr.notchpay-card-789',
                    'status' => 'pending',
                    'amount' => 550000,
                    'currency' => 'XAF',
                ],
            ], 201),
        ]);

        $response = $this->postJson('/api/payments', [
            'invoice_id' => $this->invoice->id,
            'channel' => 'cm.card',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('channel', 'cm.card')
                 ->assertJsonPath('status', 'pending')
                 ->assertJsonPath('authorization_url', 'https://pay.notchpay.co/pay_card_abc');

        $this->assertDatabaseHas('payments', [
            'invoice_id' => $this->invoice->id,
            'channel' => 'cm.card',
            'status' => 'pending',
            'notchpay_trx_ref' => 'tr.notchpay-card-789',
        ]);

        Http::assertSent(function ($request) {
            return $request->method() === 'POST'
                && str_contains($request->url(), '/payments')
                && ($request->data()['channels'] ?? null) === ['card']
                && ($request->data()['phone'] ?? null) === '+237690000000';
        });

        Http::assertNotSent(function ($request) {
            return $request->method() === 'PUT';
        });
    }

    public function test_card_init_omits_invalid_customer_phone()
    {
        $this->customer->update(['phone' => '+225 07 00 00 00']);

        Http::fake([
            'api.notchpay.co/payments' => Http::response([
                'status' => 'Accepted',
                'authorization_url' => 'https://pay.notchpay.co/pay_card_abc',
                'transaction' => [
                    'reference' => 'tr.notchpay-card-phone',
                    'status' => 'pending',
                ],
            ], 201),
        ]);

        $response = $this->postJson('/api/payments', [
            'invoice_id' => $this->invoice->id,
            'channel' => 'cm.card',
        ]);

        $response->assertStatus(201);

        Http::assertSent(function ($request) {
            $body = $request->data();

            return $request->method() === 'POST'
                && str_contains($request->url(), '/payments')
                && ! array_key_exists('phone', $body)
                && ($body['email'] ?? null) === 'jane@technova.com';
        });
    }

    public function test_card_callback_verifies_payment()
    {
        $payment = Payment::create([
            'invoice_id' => $this->invoice->id,
            'customer_id' => $this->customer->id,
            'notchpay_reference' => 'PAY-CARD123',
            'notchpay_trx_ref' => 'tr.notchpay-card-callback',
            'amount' => 550000,
            'currency' => 'XAF',
            'channel' => 'cm.card',
            'status' => 'pending',
        ]);

        Http::fake([
            'api.notchpay.co/payments/tr.notchpay-card-callback' => Http::response([
                'transaction' => [
                    'reference' => 'tr.notchpay-card-callback',
                    'status' => 'complete',
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/payments/callback?reference=tr.notchpay-card-callback');

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'complete');

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'complete',
        ]);

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => 'paid',
        ]);
    }

    public function test_invalid_channel_is_rejected()
    {
        $response = $this->postJson('/api/payments', [
            'invoice_id' => $this->invoice->id,
            'channel' => 'invalid_channel',
            'phone' => '+237680000000',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('channel');
    }

    public function test_invalid_phone_is_rejected()
    {
        $response = $this->postJson('/api/payments', [
            'invoice_id' => $this->invoice->id,
            'channel' => 'cm.mtn',
            'phone' => '12345',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('phone');
    }
}
