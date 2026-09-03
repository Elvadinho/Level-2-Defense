<?php

namespace Modules\Payment\Adapters;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Payment\Contracts\PaymentGatewayInterface;

class FlutterwaveGateway implements PaymentGatewayInterface
{
    private string $baseUrl;
    private string $secretKey;
    private string $publicKey;
    private string $secretHash;

    public function __construct(array $config = [])
    {
        $this->baseUrl = (string) ($config['base_url'] ?? config('services.flutterwave.base_url') ?? 'https://api.flutterwave.com/v3');
        $this->secretKey = (string) ($config['secret_key'] ?? config('services.flutterwave.secret_key') ?? '');
        $this->publicKey = (string) ($config['public_key'] ?? config('services.flutterwave.public_key') ?? '');
        $this->secretHash = (string) ($config['secret_hash'] ?? config('services.flutterwave.secret_hash') ?? '');
    }

    public function getGatewayName(): string
    {
        return 'flutterwave';
    }

    public function formatPhone(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (strlen($digits) === 9 && str_starts_with($digits, '6')) {
            $digits = '237' . $digits;
        }

        if (strlen($digits) >= 9) {
            return '+' . $digits;
        }

        return null;
    }

    public function initializePayment(array $data): array
    {
        $payload = [
            'tx_ref' => $data['reference'],
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'XAF',
            'redirect_url' => $data['callback'] ?? config('notchpay.callback_url'),
            'customer' => [
                'email' => $data['email'] ?? 'customer@example.com',
                'phonenumber' => $this->formatPhone($data['phone'] ?? null),
                'name' => $data['customer_name'] ?? 'Customer',
            ],
            'customizations' => [
                'title' => $data['description'] ?? 'Invoice Payment',
            ],
        ];

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/payments", $payload);

        if ($response->failed()) {
            Log::error('Flutterwave Init Failed', ['body' => $response->body()]);
            throw new \RuntimeException('Failed to initialize payment with Flutterwave: ' . $response->body());
        }

        $resData = $response->json();

        return [
            'status' => 'success',
            'reference' => $data['reference'],
            'transaction' => [
                'reference' => (string) ($resData['data']['id'] ?? $data['reference']),
                'status' => 'pending',
                'amount' => $data['amount'],
                'currency' => $data['currency'] ?? 'XAF',
            ],
            'authorization_url' => $resData['data']['link'] ?? null,
            'raw' => $resData,
        ];
    }

    public function processPayment(string $reference, string $channel, string $phone): array
    {
        $payload = [
            'tx_ref' => $reference,
            'phone_number' => $this->formatPhone($phone) ?? $phone,
            'network' => str_contains($channel, 'mtn') ? 'MTN' : 'ORANGE',
        ];

        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/charges?type=mobile_money_franco", $payload);

        if ($response->failed()) {
            Log::error('Flutterwave Charge Failed', ['body' => $response->body()]);
            throw new \RuntimeException('Failed to process Flutterwave charge: ' . $response->body());
        }

        return $response->json();
    }

    public function verifyPayment(string $reference): array
    {
        $response = Http::withToken($this->secretKey)
            ->get("{$this->baseUrl}/transactions/verify_by_reference?tx_ref={$reference}");

        if ($response->failed()) {
            // Try with transaction ID
            $response = Http::withToken($this->secretKey)
                ->get("{$this->baseUrl}/transactions/{$reference}/verify");
        }

        if ($response->failed()) {
            Log::error('Flutterwave Verify Failed', ['body' => $response->body()]);
            throw new \RuntimeException('Failed to verify payment with Flutterwave: ' . $response->body());
        }

        $data = $response->json();
        $fwStatus = strtolower($data['data']['status'] ?? 'pending');
        $status = $fwStatus === 'successful' ? 'complete' : ($fwStatus === 'failed' ? 'failed' : 'pending');

        return [
            'status' => 'success',
            'transaction' => [
                'reference' => (string) ($data['data']['id'] ?? $reference),
                'status' => $status,
                'amount' => $data['data']['amount'] ?? 0,
                'currency' => $data['data']['currency'] ?? 'XAF',
            ],
            'raw' => $data,
        ];
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        if (empty($this->secretHash)) {
            return true;
        }

        return hash_equals($this->secretHash, $signature);
    }
}
