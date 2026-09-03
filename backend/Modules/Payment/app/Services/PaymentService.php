<?php

namespace Modules\Payment\Services;

use Modules\Payment\Models\Payment;
use Modules\Invoice\Models\Invoice;
use Modules\Payment\Contracts\PaymentGatewayInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    private PaymentGatewayInterface $gateway;

    public function __construct(?PaymentGatewayInterface $gateway = null)
    {
        $this->gateway = $gateway ?? app(PaymentGatewayInterface::class);
    }

    /**
     * Get the active payment gateway instance.
     */
    public function getGateway(): PaymentGatewayInterface
    {
        return $this->gateway;
    }

    /**
     * Set the active payment gateway instance.
     */
    public function setGateway(PaymentGatewayInterface $gateway): self
    {
        $this->gateway = $gateway;
        return $this;
    }

    public function getAll(): Collection
    {
        return Payment::with('invoice', 'customer')->orderBy('created_at', 'desc')->get();
    }

    public function getById(int $id): Payment
    {
        return Payment::with('invoice', 'customer')->findOrFail($id);
    }

    /**
     * Initialize + Process a payment for an invoice.
     * This is the main endpoint your frontend will call.
     */
    public function initiatePayment(array $data): Payment
    {
        return DB::transaction(function () use ($data) {
            $invoice = Invoice::with('customer')->findOrFail($data['invoice_id']);
            $reference = 'PAY-' . Str::upper(Str::random(12));
            $isCard = $data['channel'] === 'cm.card';
            $phone = $this->gateway->formatPhone($data['phone'] ?? null)
                ?? $this->gateway->formatPhone($invoice->customer->phone);

            // 1. Create local payment record
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'amount' => $invoice->total_amount,
                'currency' => config('notchpay.currency'),
                'channel' => $data['channel'],     // 'cm.mtn', 'cm.orange', or 'cm.card'
                'phone' => $phone,
                'notchpay_reference' => $reference,
                'status' => 'pending',
            ]);

            // 2. Initialize on NotchPay
            $initPayload = [
                'amount' => $invoice->total_amount,
                'currency' => config('notchpay.currency'),
                'email' => $invoice->customer->email,
                'phone' => $phone,
                'reference' => $reference,
                'description' => "Payment for Invoice #{$invoice->invoice_number}",
            ];

            if ($isCard) {
                $initPayload['channels'] = ['card'];
            }

            $initResponse = $this->gateway->initializePayment($initPayload);

            // NotchPay's own transaction reference (e.g. tr.xxx) — NOT our merchant PAY-xxx.
            // Process/verify URLs must use this id; using the merchant reference returns 404.
            $notchpayRef = $initResponse['transaction']['reference']
                ?? $initResponse['reference']
                ?? null;

            if (!$notchpayRef) {
                throw new \RuntimeException('NotchPay did not return a payment reference.');
            }

            $payment->update(['notchpay_trx_ref' => $notchpayRef]);

            // Card (Visa/Mastercard): customer pays on NotchPay checkout — never collect PAN here.
            // Mobile money: process the channel so the customer gets a MoMo prompt.
            if (!$isCard) {
                $this->gateway->processPayment(
                    $notchpayRef,
                    $data['channel'],
                    $phone
                );
                $payment->update(['status' => 'processing']);
            }

            $payment = $payment->load('invoice', 'customer');
            $payment->setAttribute('authorization_url', $initResponse['authorization_url'] ?? null);

            return $payment;
        });
    }

    /**
     * Verify payment status from NotchPay.
     */
    public function verifyPayment(int $id): Payment
    {
        $payment = Payment::findOrFail($id);

        $notchpayRef = $payment->notchpay_trx_ref ?: $payment->notchpay_reference;
        $response = $this->gateway->verifyPayment($notchpayRef);
        $status = $response['transaction']['status'] ?? 'pending';

        $payment->update([
            'status' => $status,
            'paid_at' => $status === 'complete' ? now() : null,
        ]);

        // If payment is complete, update the invoice status too
        if ($status === 'complete') {
            $payment->invoice->update(['status' => 'paid']);
        }

        return $payment;
    }

    public function verifyByNotchPayReference(string $reference): Payment
    {
        $payment = Payment::where('notchpay_reference', $reference)
            ->orWhere('notchpay_trx_ref', $reference)
            ->firstOrFail();

        return $this->verifyPayment($payment->id);
    }

    /**
     * Handle webhook callback from NotchPay.
     */
    public function handleWebhook(array $data): void
    {
        $reference = $data['data']['reference']
            ?? $data['data']['merchant_reference']
            ?? null;
        $status = $data['data']['status'] ?? null;

        if (!$reference || !$status) {
            return;
        }

        $payment = Payment::where('notchpay_reference', $reference)
            ->orWhere('notchpay_trx_ref', $reference)
            ->first();

        if (!$payment) {
            return;
        }

        $payment->update([
            'status' => $status,
            'paid_at' => $status === 'complete' ? now() : null,
            'failure_reason' => $status === 'failed' ? ($data['data']['message'] ?? 'Payment failed') : null,
        ]);

        // Auto-update the invoice if payment succeeds
        if ($status === 'complete') {
            $payment->invoice->update(['status' => 'paid']);
        }
    }
}