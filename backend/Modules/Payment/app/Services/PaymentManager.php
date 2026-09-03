<?php

namespace Modules\Payment\Services;

use Closure;
use Illuminate\Contracts\Foundation\Application;
use Modules\Payment\Adapters\FlutterwaveGateway;
use Modules\Payment\Adapters\StripeGateway;
use Modules\Payment\Contracts\PaymentGatewayInterface;

/**
 * PAYMENT MANAGER (Hexagonal Architecture Gateway Resolver)
 *
 * Implements PaymentGatewayInterface and manages the active payment gateways:
 * 1. NotchPay (Cameroon MoMo & Card)
 * 2. Stripe (Global Card & Payment Intents)
 * 3. Flutterwave (African Mobile Money & Cards)
 *
 * It allows switching payment gateways via configuration or dynamically at runtime.
 */
class PaymentManager implements PaymentGatewayInterface
{
    protected Application $app;
    protected array $drivers = [];
    protected array $customCreators = [];
    protected ?string $defaultDriver = null;

    public function __construct(Application $app)
    {
        $this->app = $app;
    }

    public function getGatewayName(): string
    {
        return $this->driver()->getGatewayName();
    }

    /**
     * Get default gateway name from config/payment.php or env.
     */
    public function getDefaultDriver(): string
    {
        return $this->defaultDriver
            ?? config('payment.default')
            ?? 'notchpay';
    }

    /**
     * Change default gateway driver at runtime.
     */
    public function setDefaultDriver(string $name): self
    {
        $this->defaultDriver = $name;
        return $this;
    }

    /**
     * Get a specific gateway instance (e.g. 'notchpay', 'stripe', 'flutterwave').
     */
    public function driver(?string $driver = null): PaymentGatewayInterface
    {
        $driver = $driver ?: $this->getDefaultDriver();

        if (!isset($this->drivers[$driver])) {
            $this->drivers[$driver] = $this->createDriver($driver);
        }

        return $this->drivers[$driver];
    }

    /**
     * Instantiate the corresponding gateway adapter.
     */
    protected function createDriver(string $driver): PaymentGatewayInterface
    {
        if (isset($this->customCreators[$driver])) {
            return $this->customCreators[$driver]($this->app);
        }

        return match ($driver) {
            'notchpay' => new NotchPayGateway(),
            'stripe' => new StripeGateway(),
            'flutterwave' => new FlutterwaveGateway(),
            default => throw new \InvalidArgumentException("Payment gateway driver [{$driver}] is not supported."),
        };
    }

    /**
     * Register a custom gateway adapter at runtime.
     */
    public function extend(string $driver, Closure $callback): self
    {
        $this->customCreators[$driver] = $callback;
        return $this;
    }

    /**
     * Forward initialize payment to active gateway.
     */
    public function initializePayment(array $data): array
    {
        return $this->driver()->initializePayment($data);
    }

    /**
     * Forward process payment to active gateway.
     */
    public function processPayment(string $reference, string $channel, string $phone): array
    {
        return $this->driver()->processPayment($reference, $channel, $phone);
    }

    /**
     * Forward verify payment to active gateway.
     */
    public function verifyPayment(string $reference): array
    {
        return $this->driver()->verifyPayment($reference);
    }

    /**
     * Forward verify webhook signature to active gateway.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        return $this->driver()->verifyWebhookSignature($payload, $signature);
    }

    /**
     * Forward phone formatting to active gateway.
     */
    public function formatPhone(?string $phone): ?string
    {
        return $this->driver()->formatPhone($phone);
    }
}
