<?php

namespace Modules\Payment\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotchPayGateway
{
    private string $baseUrl;
    private string $publicKey;

    public function __construct()
    {
        $this->baseUrl = config('notchpay.base_url');
        $this->publicKey = config('notchpay.public_key');
    }

    /**
     * NotchPay rejects formatted numbers (spaces, dashes) and incomplete local numbers.
     * Returns E.164 like +237690000000, or null if it cannot be made valid.
     */
    public function formatPhone(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        // Cameroon local mobile: 6XXXXXXXX
        if (strlen($digits) === 9 && str_starts_with($digits, '6')) {
            $digits = '237' . $digits;
        }

        // NotchPay expects a real MSISDN. Only send Cameroon E.164 (+237 + 9 digits).
        if (strlen($digits) === 12 && str_starts_with($digits, '237')) {
            return '+' . $digits;
        }

        return null;
    }

    /**
     * Step 1: Initialize a payment on NotchPay.
     * Returns the full response body including "reference".
     */
    public function initializePayment(array $data): array
    {
        $payload = array_filter([
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? config('notchpay.currency'),
            'email' => $data['email'] ?? null,
            'phone' => $this->formatPhone($data['phone'] ?? null),
            'reference' => $data['reference'],
            'description' => $data['description'] ?? 'Invoice Payment',
            'callback' => $data['callback'] ?? config('notchpay.callback_url'),
            'channels' => $data['channels'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');

        $response = Http::withHeaders([
            'Authorization' => $this->publicKey,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->post("{$this->baseUrl}/payments", $payload);

        if ($response->failed()) {
            Log::error('NotchPay Init Failed', ['body' => $response->body()]);
            throw new \RuntimeException('Failed to initialize payment with NotchPay: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Step 2: Process the payment via a specific channel (Orange Money / MTN / Card).
     */
    public function processPayment(string $reference, string $channel, string $phone): array
    {
        $response = Http::withHeaders([
            'Authorization' => $this->publicKey,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->put("{$this->baseUrl}/payments/{$reference}", [
                    'channel' => $channel,
                    'data' => [
                        'phone' => $this->formatPhone($phone) ?? $phone,
                    ],
                ]);

        if ($response->failed()) {
            Log::error('NotchPay process Failed', ['body' => $response->body()]);
            throw new \RuntimeException('Failed to process payment: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Step 3: Verify the status of a payment.
     */
    public function verifyPayment(string $reference): array
    {
        $response = Http::withHeaders([
            'Authorization' => $this->publicKey,
            'Accept' => 'application/json',
        ])->get("{$this->baseUrl}/payments/{$reference}");

        if ($response->failed()) {
            Log::error('NotchPay verify Failed', ['body' => $response->body()]);
            throw new \RuntimeException('Failed to verify payment: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Verify that a webhook payload is authentic using the hash key.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $hashKey = config('notchpay.hash_key');
        $computedHash = hash_hmac('sha256', $payload, $hashKey);
        return hash_equals($computedHash, $signature);
    }
}