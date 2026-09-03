<?php

namespace Modules\AIAssistant\Services;

use Closure;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Log;
use Modules\AIAssistant\Adapters\HuggingFaceAdapter;
use Modules\AIAssistant\Adapters\LocalLlamaAdapter;
use Modules\AIAssistant\Adapters\NvidiaNimAdapter;
use Modules\AIAssistant\Contracts\AiProviderInterface;

/**
 * AI MANAGER & FALLBACK ROUTER
 *
 * Implements AiProviderInterface and manages active AI drivers:
 * 1. Nvidia NIM
 * 2. Hugging Face
 * 3. Local Llama
 *
 * It automatically fails over to the next provider if the primary provider is unreachable.
 */
class AiManager implements AiProviderInterface
{
    protected Application $app;
    protected array $drivers = [];
    protected array $customCreators = [];
    protected ?string $defaultDriver = null;

    public function __construct(Application $app)
    {
        $this->app = $app;
    }

    public function getName(): string
    {
        return 'manager';
    }

    /**
     * Get default provider name (configured in config/ai.php or env).
     */
    public function getDefaultDriver(): string
    {
        return $this->defaultDriver
            ?? config('ai.default')
            ?? config('services.ai_default')
            ?? 'nvidia';
    }

    /**
     * Change default driver at runtime.
     */
    public function setDefaultDriver(string $name): self
    {
        $this->defaultDriver = $name;
        return $this;
    }

    /**
     * Get a specific AI driver instance.
     */
    public function driver(?string $driver = null): AiProviderInterface
    {
        $driver = $driver ?: $this->getDefaultDriver();

        if (!isset($this->drivers[$driver])) {
            $this->drivers[$driver] = $this->createDriver($driver);
        }

        return $this->drivers[$driver];
    }

    /**
     * Create adapter instance for a given driver name.
     */
    protected function createDriver(string $driver): AiProviderInterface
    {
        if (isset($this->customCreators[$driver])) {
            return $this->customCreators[$driver]($this->app);
        }

        return match ($driver) {
            'nvidia' => new NvidiaNimAdapter(config('services.nvidia', [])),
            'huggingface' => new HuggingFaceAdapter(config('services.huggingface', [])),
            'local_llama' => new LocalLlamaAdapter(config('services.local_llama', [])),
            default => throw new \InvalidArgumentException("AI driver [{$driver}] is not supported."),
        };
    }

    /**
     * Register a custom AI driver.
     */
    public function extend(string $driver, Closure $callback): self
    {
        $this->customCreators[$driver] = $callback;
        return $this;
    }

    /**
     * Send chat request with automatic fallback failover.
     */
    public function chat(array $messages, array $options = []): array
    {
        return $this->chatWithFallback($messages, $options);
    }

    /**
     * Execute chat with fallback across available providers.
     */
    public function chatWithFallback(array $messages, array $options = [], ?array $fallbackChain = null): array
    {
        $chain = $fallbackChain ?? config('ai.fallback_chain', [$this->getDefaultDriver(), 'huggingface', 'local_llama']);
        
        $default = $this->getDefaultDriver();
        if (!in_array($default, $chain, true)) {
            array_unshift($chain, $default);
        }
        $chain = array_values(array_unique($chain));

        $errors = [];

        foreach ($chain as $driverName) {
            try {
                $driver = $this->driver($driverName);
                $result = $driver->chat($messages, $options);

                if (!empty($result['success'])) {
                    return $result;
                }

                $errors[$driverName] = $result['error'] ?? 'Request failed';
                Log::warning("AI Provider [{$driverName}] failed: {$errors[$driverName]}. Attempting next fallback...");
            } catch (\Throwable $e) {
                $errors[$driverName] = $e->getMessage();
                Log::warning("AI Provider [{$driverName}] exception: {$e->getMessage()}. Attempting next fallback...");
            }
        }

        $summary = implode('; ', array_map(fn ($k, $v) => "{$k}: {$v}", array_keys($errors), $errors));

        return [
            'success' => false,
            'provider' => 'fallback_chain',
            'error' => "All AI providers in fallback chain failed: [{$summary}]",
            'errors' => $errors,
        ];
    }
}
