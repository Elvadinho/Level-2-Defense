<?php

namespace Modules\Payment\Adapters;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Payment\Contracts\PaymentGatewayInterface;

class StripeGateway implements PaymentGatewayInterface
{
    private string $baseUrl;
    private string $secretKey;
    private string $publicKey;
    private string $webhookSecret;

    public function __construct(array $config = [])
    {
        $this->baseUrl = (string) ($config['base_url'] ?? config('services.stripe.base_url') ?? 'https://api.stripe.com');
        $this->secretKey = (string) ($config['secret_key'] ?? config('services.stripe.secret_key') ?? '');
        $this->publicKey = (string) ($config['public_key'] ?? config('services.stripe.public_key') ?? '');
        $this->webhookSecret = (string) ($config['webhook_secret'] ?? config('services.stripe.webhook_secret') ?? '');
    }

    public function getGatewayName(): string
    {
        return 'stripe';
    }

    public function formatPhone(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        return '+' . $digits;
    }

    public function initializePayment(array $data): array
    {
        $amountInCents = (int) ($data['amount'] * 100);

        $payload = [
            'amount' => $amountInCents,
            'currency' => strtolower($data['currency'] ?? 'xaf'),
            'description' => $data['description'] ?? "Invoice Payment #{$data['reference']}",
            'metadata' => [
                'merchant_reference' => $data['reference'],
                'customer_email' => $data['email'] ?? null,
                'customer_phone' => $data['phone'] ?? null,
            ],
            'payment_method_types' => ['card'],
        ];

        $response = Http::withToken($this->secretKey)
            ->asForm()
            ->post("{$this->baseUrl}/v1/payment_intents", $payload);

        if ($response->failed()) {
            Log::error('Stripe Init Failed', ['body' => $response->body()]);
            throw new \RuntimeException('Failed to initialize payment with Stripe: ' . $response->body());
        }

        $resData = $response->json();

        return [
            'status' => 'success',
            'reference' => $data['reference'],
            'transaction' => [
                'reference' => (string) ($resData['id'] ?? $data['reference']),
                'status' => 'pending',
                'amount' => $data['amount'],
                'currency' => strtoupper($data['currency'] ?? 'XAF'),
            ],
            'client_secret' => $resData['client_secret'] ?? null,
            'authorization_url' => null,
            'raw' => $resData,
        ];
    }

    public function processPayment(string $reference, string $channel, string $phone): array
    {
        // For card or alternative payment methods in Stripe
        return [
            'status' => 'processing',
            'reference' => $reference,
            'channel' => $channel,
        ];
    }

    public function verifyPayment(string $reference): array
    {
        $response = Http::withToken($this->secretKey)
            ->get("{$this->baseUrl}/v1/payment_intents/{$reference}");

        if ($response->failed()) {
            Log::error('Stripe Verify Failed', ['body' => $response->body()]);
            throw new \RuntimeException('Failed to verify payment with Stripe: ' . $response->body());
        }

        $data = $response->json();
        $stripeStatus = strtolower($data['status'] ?? 'pending');
        $status = $stripeStatus === 'succeeded' ? 'complete' : ($stripeStatus === 'canceled' ? 'failed' : 'pending');

        return [
            'status' => 'success',
            'transaction' => [
                'reference' => (string) ($data['id'] ?? $reference),
                'status' => $status,
                'amount' => ($data['amount'] ?? 0) / 100,
                'currency' => strtoupper($data['currency'] ?? 'XAF'),
            ],
            'raw' => $data,
        ];
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        if (empty($this->webhookSecret)) {
            return true;
        }

        // Basic Stripe signature verification format t=timestamp,v1=hash
        if (preg_match('/t=(\d+),v1=([a-f0-9]+)/', $signature, $matches)) {
            $timestamp = $matches[1];
            $expectedSignature = $matches[2];
            $signedPayload = "{$timestamp}.{$payload}";
            $computedSignature = hash_hmac('sha256', $signedPayload, $this->webhookSecret);
            return hash_equals($computedSignature, $expectedSignature);
        }

        return false;
    }
}
