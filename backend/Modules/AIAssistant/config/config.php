<?php

return [
    'name' => 'AIAssistant',

    /*
    |--------------------------------------------------------------------------
    | Default AI Provider Driver
    |--------------------------------------------------------------------------
    |
    | Supported: "nvidia", "openai", "anthropic", "local_llama"
    |
    */
    'default' => env('AI_DEFAULT_PROVIDER', 'nvidia'),

    /*
    |--------------------------------------------------------------------------
    | AI Provider Fallback Chain
    |--------------------------------------------------------------------------
    |
    | When primary provider is down or returns an error, the AI Manager will
    | automatically failover through this list of secondary providers in order.
    |
    */
    'fallback_chain' => [
        'nvidia',
        'huggingface',
        'local_llama',
    ],
];
