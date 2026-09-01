<?php

namespace Modules\Payment\Services;

use Modules\Payment\Models\Payment;
use Modules\Invoice\Models\Invoice;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function __construct(private NotchPayGateway $gateway)
    {
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

            // 1. Create local payment record
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'amount' => $invoice->total_amount,
                'currency' => config('notchpay.currency'),
                'channel' => $data['channel'],     // 'cm.mtn' or 'cm.orange'
                'phone' => $data['phone'],
                'notchpay_reference' => $reference,
                'status' => 'pending',
            ]);

            // 2. Initialize on NotchPay
            $initResponse = $this->gateway->initializePayment([
                'amount' => $invoice->total_amount,
                'currency' => config('notchpay.currency'),
                'email' => $invoice->customer->email,
                'phone' => $data['phone'],
                'reference' => $reference,
                'description' => "Payment for Invoice #{$invoice->invoice_number}",
            ]);

            // NotchPay's own transaction reference (e.g. tr.xxx) — NOT our merchant PAY-xxx.
            // Process/verify URLs must use this id; using the merchant reference returns 404.
            $notchpayRef = $initResponse['transaction']['reference']
                ?? $initResponse['reference']
                ?? null;

            if (!$notchpayRef) {
                throw new \RuntimeException('NotchPay did not return a payment reference.');
            }

            $payment->update(['notchpay_trx_ref' => $notchpayRef]);

            // 3. Process via the chosen channel (triggers MoMo prompt)
            $this->gateway->processPayment(
                $notchpayRef,
                $data['channel'],
                $data['phone']
            );

            // Update status to processing (MoMo prompt sent to phone)
            $payment->update([
                'status' => 'processing',
            ]);
            return $payment->load('invoice', 'customer');
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