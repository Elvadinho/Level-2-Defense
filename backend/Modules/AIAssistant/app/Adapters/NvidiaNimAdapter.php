<?php

namespace Modules\AIAssistant\Adapters;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\AIAssistant\Contracts\AiProviderInterface;

/**
 * ADAPTER 1: NVIDIA NIM (Hexagonal Architecture)
 *
 * Implements AiProviderInterface to connect with NVIDIA NIM Cloud endpoints.
 */
class NvidiaNimAdapter implements AiProviderInterface
{
    private string $apiKey;
    private string $apiUrl;
    private string $model;
    private float $temperature;
    private string $reasoningEffort;
    private int $timeout;

    public function __construct(array $config = [])
    {
        $this->apiKey = (string) ($config['api_key'] ?? config('services.nvidia.api_key') ?? '');
        $this->apiUrl = (string) ($config['api_url'] ?? config('services.nvidia.api_url') ?? 'https://integrate.api.nvidia.com/v1/chat/completions');
        $this->model = (string) ($config['model'] ?? config('services.nvidia.model') ?? 'openai/gpt-oss-20b');
        $this->temperature = (float) ($config['temperature'] ?? config('services.nvidia.temperature') ?? 0.1);
        $this->reasoningEffort = (string) ($config['reasoning_effort'] ?? config('services.nvidia.reasoning_effort') ?? 'medium');
        $this->timeout = (int) ($config['timeout'] ?? 120);
    }

    public function getName(): string
    {
        return 'nvidia';
    }

    public function chat(array $messages, array $options = []): array
    {
        if (empty($this->apiKey)) {
            return [
                'success' => false,
                'provider' => $this->getName(),
                'error' => 'NVIDIA API key not configured. Set NVIDIA_API_KEY in .env',
            ];
        }

        try {
            $payload = [
                'model' => $options['model'] ?? $this->model,
                'messages' => $messages,
                'temperature' => (float) ($options['temperature'] ?? $this->temperature),
                'top_p' => 0.9,
                'max_tokens' => $options['max_tokens'] ?? 2048,
                'stream' => false,
            ];

            $reasoningEffort = $options['reasoning_effort'] ?? $this->reasoningEffort;
            if (!empty($reasoningEffort)) {
                $payload['reasoning_effort'] = $reasoningEffort;
            }

            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Authorization' => "Bearer {$this->apiKey}",
                ])
                ->post($this->apiUrl, $payload);

            if (!$response->successful()) {
                Log::error('NVIDIA NIM API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'provider' => $this->getName(),
                    'error' => "NVIDIA API returned HTTP {$response->status()}",
                ];
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? null;

            if (!$content) {
                return [
                    'success' => false,
                    'provider' => $this->getName(),
                    'error' => 'No content in NVIDIA API response',
                ];
            }

            return [
                'success' => true,
                'provider' => $this->getName(),
                'content' => trim($content),
                'reasoning' => $data['choices'][0]['message']['reasoning_content'] ?? null,
                'raw' => $data,
                'usage' => $data['usage'] ?? null,
            ];
        } catch (\Throwable $e) {
            Log::error('NVIDIA API call failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'provider' => $this->getName(),
                'error' => $e->getMessage(),
            ];
        }
    }
}
