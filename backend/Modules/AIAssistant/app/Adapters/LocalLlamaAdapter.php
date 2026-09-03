<?php

namespace Modules\AIAssistant\Adapters;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\AIAssistant\Contracts\AiProviderInterface;

/**
 * ADAPTER 3: Local Llama / Ollama (Hexagonal Architecture)
 *
 * Implements AiProviderInterface to connect with a locally hosted LLM
 * (such as Ollama, llama.cpp, or vLLM) via OpenAI-compatible endpoints.
 */
class LocalLlamaAdapter implements AiProviderInterface
{
    private string $apiKey;
    private string $apiUrl;
    private string $model;
    private float $temperature;
    private int $timeout;

    public function __construct(array $config = [])
    {
        $this->apiKey = (string) ($config['api_key'] ?? config('services.local_llama.api_key') ?? 'ollama');
        $this->apiUrl = (string) ($config['api_url'] ?? config('services.local_llama.api_url') ?? 'http://localhost:11434/v1/chat/completions');
        $this->model = (string) ($config['model'] ?? config('services.local_llama.model') ?? 'llama3:latest');
        $this->temperature = (float) ($config['temperature'] ?? config('services.local_llama.temperature') ?? 0.1);
        $this->timeout = (int) ($config['timeout'] ?? 120);
    }

    public function getName(): string
    {
        return 'local_llama';
    }

    public function chat(array $messages, array $options = []): array
    {
        try {
            $payload = [
                'model' => $options['model'] ?? $this->model,
                'messages' => $messages,
                'temperature' => (float) ($options['temperature'] ?? $this->temperature),
                'max_tokens' => $options['max_tokens'] ?? 2048,
                'stream' => false,
            ];

            $headers = ['Content-Type' => 'application/json'];
            if (!empty($this->apiKey)) {
                $headers['Authorization'] = "Bearer {$this->apiKey}";
            }

            $response = Http::timeout($this->timeout)
                ->withHeaders($headers)
                ->post($this->apiUrl, $payload);

            if (!$response->successful()) {
                Log::error('Local Llama API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'provider' => $this->getName(),
                    'error' => "Local Llama API returned HTTP {$response->status()}",
                ];
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? null;

            if (!$content) {
                return [
                    'success' => false,
                    'provider' => $this->getName(),
                    'error' => 'No content in Local Llama API response',
                ];
            }

            return [
                'success' => true,
                'provider' => $this->getName(),
                'content' => trim($content),
                'reasoning' => null,
                'raw' => $data,
                'usage' => $data['usage'] ?? null,
            ];
        } catch (\Throwable $e) {
            Log::error('Local Llama call failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'provider' => $this->getName(),
                'error' => $e->getMessage(),
            ];
        }
    }
}
