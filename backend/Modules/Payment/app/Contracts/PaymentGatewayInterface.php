<?php

namespace Modules\Payment\Contracts;

interface PaymentGatewayInterface
{
    /**
     * Initialize a payment transaction with the gateway.
     *
     * @param array $data Data containing amount, currency, email, phone, reference, description, etc.
     * @return array Gateway initialization response containing transaction references and/or redirect/authorization URLs.
     */
    public function initializePayment(array $data): array;

    /**
     * Process a payment through a specific channel (e.g. mobile money, card, etc.).
     *
     * @param string $reference Gateway transaction reference
     * @param string $channel Payment channel
     * @param string $phone Customer phone number
     * @return array Gateway processing response
     */
    public function processPayment(string $reference, string $channel, string $phone): array;

    /**
     * Verify the status of a payment against the gateway.
     *
     * @param string $reference Gateway transaction reference or merchant reference
     * @return array Verification payload containing transaction status ('complete', 'pending', 'failed', etc.)
     */
    public function verifyPayment(string $reference): array;

    /**
     * Verify webhook payload authenticity using gateway signature/secret.
     *
     * @param string $payload Raw request body
     * @param string $signature Signature header value
     * @return bool True if authentic, false otherwise
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool;

    /**
     * Format a phone number according to gateway specifications (e.g. E.164).
     *
     * @param string|null $phone
     * @return string|null
     */
    public function formatPhone(?string $phone): ?string;

    /**
     * Get the gateway identifier name (e.g. 'notchpay', 'flutterwave', 'paystack', 'stripe').
     *
     * @return string
     */
    public function getGatewayName(): string;
}
