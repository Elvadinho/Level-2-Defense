<?php

namespace Modules\AIAssistant\Adapters;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\AIAssistant\Contracts\AiProviderInterface;

/**
 * ADAPTER 2: Hugging Face (Hexagonal Architecture)
 *
 * Implements AiProviderInterface to interact with Hugging Face Inference API.
 */
class HuggingFaceAdapter implements AiProviderInterface
{
    private string $apiKey;
    private string $apiUrl;
    private string $model;
    private float $temperature;
    private int $timeout;

    public function __construct(array $config = [])
    {
        $this->apiKey = (string) ($config['api_key'] ?? config('services.huggingface.api_key') ?? '');
        $this->model = (string) ($config['model'] ?? config('services.huggingface.model') ?? 'meta-llama/Meta-Llama-3-8B-Instruct');
        $this->apiUrl = (string) ($config['api_url'] ?? config('services.huggingface.api_url') ?? "https://api-inference.huggingface.co/models/{$this->model}/v1/chat/completions");
        $this->temperature = (float) ($config['temperature'] ?? config('services.huggingface.temperature') ?? 0.1);
        $this->timeout = (int) ($config['timeout'] ?? 120);
    }

    public function getName(): string
    {
        return 'huggingface';
    }

    public function chat(array $messages, array $options = []): array
    {
        if (empty($this->apiKey)) {
            return [
                'success' => false,
                'provider' => $this->getName(),
                'error' => 'Hugging Face API key not configured. Set HUGGINGFACE_API_KEY in .env',
            ];
        }

        try {
            $payload = [
                'model' => $options['model'] ?? $this->model,
                'messages' => $messages,
                'temperature' => (float) ($options['temperature'] ?? $this->temperature),
                'max_tokens' => $options['max_tokens'] ?? 2048,
            ];

            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Authorization' => "Bearer {$this->apiKey}",
                ])
                ->post($this->apiUrl, $payload);

            if (!$response->successful()) {
                Log::error('Hugging Face API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'provider' => $this->getName(),
                    'error' => "Hugging Face API returned HTTP {$response->status()}",
                ];
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? null;

            if (!$content) {
                return [
                    'success' => false,
                    'provider' => $this->getName(),
                    'error' => 'No content in Hugging Face API response',
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
            Log::error('Hugging Face API call failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'provider' => $this->getName(),
                'error' => $e->getMessage(),
            ];
        }
    }
}
