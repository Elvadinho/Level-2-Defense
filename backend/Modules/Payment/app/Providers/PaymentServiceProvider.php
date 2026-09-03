<?php

namespace Modules\Payment\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;
use Modules\Payment\Contracts\PaymentGatewayInterface;
use Modules\Payment\Services\PaymentManager;
use Modules\Payment\Services\PaymentService;
use Modules\Payment\Services\NotchPayGateway;

class PaymentServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Payment';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'payment';

    /**
     * Provider classes to register.
     *
     * @var string[]
     */
    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        parent::register();

        $this->mergeConfigFrom(
            module_path($this->name, 'config/config.php'),
            'payment'
        );

        $this->app->singleton(PaymentManager::class, function ($app) {
            return new PaymentManager($app);
        });

        $this->app->bind(PaymentGatewayInterface::class, function ($app) {
            return $app->make(PaymentManager::class);
        });

        $this->app->singleton(PaymentService::class, function ($app) {
            return new PaymentService(
                $app->make(PaymentGatewayInterface::class)
            );
        });

        // Maintain backward compatibility for direct NotchPayGateway injection
        $this->app->singleton(NotchPayGateway::class, function ($app) {
            return new NotchPayGateway();
        });
    }
}
