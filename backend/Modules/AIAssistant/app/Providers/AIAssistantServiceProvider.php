<?php

namespace Modules\AIAssistant\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;
use Modules\AIAssistant\Contracts\AiProviderInterface;
use Modules\AIAssistant\Services\AiManager;
use Modules\AIAssistant\Services\AssistantService;

class AIAssistantServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'AIAssistant';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'aiassistant';

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
            'ai'
        );

        $this->app->singleton(AiManager::class, function ($app) {
            return new AiManager($app);
        });

        $this->app->bind(AiProviderInterface::class, function ($app) {
            return $app->make(AiManager::class);
        });

        $this->app->singleton(AssistantService::class, function ($app) {
            return new AssistantService(
                $app->make(AiProviderInterface::class)
            );
        });
    }
}
