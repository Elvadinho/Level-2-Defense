<?php

namespace Modules\AIAssistant\Contracts;

/**
 * PORT (Hexagonal Architecture / Dependency Inversion Principle)
 *
 * This interface defines the contract that any AI provider must implement.
 * High-level business logic (AssistantService) depends ONLY on this abstraction,
 * never directly on specific AI vendor SDKs or HTTP APIs.
 */
interface AiProviderInterface
{
    /**
     * Send chat messages to the AI provider and return a structured response.
     *
     * @param array $messages List of messages [['role' => 'system'|'user'|'assistant', 'content' => '...']]
     * @param array $options Additional options such as model, temperature, max_tokens
     * @return array Standardized result ['success' => bool, 'content' => string|null, 'provider' => string, 'error' => string|null]
     */
    public function chat(array $messages, array $options = []): array;

    /**
     * Get the name of this AI provider (e.g., 'nvidia', 'huggingface', 'local_llama').
     */
    public function getName(): string;
}
