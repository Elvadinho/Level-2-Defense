<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'nvidia' => [
        'api_key' => env('NVIDIA_API_KEY'),
        'api_url' => env('NVIDIA_API_URL', 'https://integrate.api.nvidia.com/v1/chat/completions'),
        'model' => env('NVIDIA_MODEL', 'openai/gpt-oss-20b'),
        'temperature' => (float) env('NVIDIA_TEMPERATURE', 0.1),
        'reasoning_effort' => env('NVIDIA_REASONING_EFFORT', 'medium'),
    ],

    'huggingface' => [
        'api_key' => env('HUGGINGFACE_API_KEY'),
        'api_url' => env('HUGGINGFACE_API_URL', 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct/v1/chat/completions'),
        'model' => env('HUGGINGFACE_MODEL', 'meta-llama/Meta-Llama-3-8B-Instruct'),
        'temperature' => (float) env('HUGGINGFACE_TEMPERATURE', 0.1),
    ],

    'local_llama' => [
        'api_key' => env('LOCAL_LLAMA_API_KEY', 'ollama'),
        'api_url' => env('LOCAL_LLAMA_API_URL', 'http://localhost:11434/v1/chat/completions'),
        'model' => env('LOCAL_LLAMA_MODEL', 'llama3:latest'),
        'temperature' => (float) env('LOCAL_LLAMA_TEMPERATURE', 0.1),
    ],

    'ai_default' => env('AI_DEFAULT_PROVIDER', 'nvidia'),

    'flutterwave' => [
        'public_key' => env('FLUTTERWAVE_PUBLIC_KEY', ''),
        'secret_key' => env('FLUTTERWAVE_SECRET_KEY', ''),
        'encryption_key' => env('FLUTTERWAVE_ENCRYPTION_KEY', ''),
        'secret_hash' => env('FLUTTERWAVE_SECRET_HASH', ''),
        'base_url' => env('FLUTTERWAVE_BASE_URL', 'https://api.flutterwave.com/v3'),
    ],

    'stripe' => [
        'public_key' => env('STRIPE_PUBLIC_KEY', ''),
        'secret_key' => env('STRIPE_SECRET_KEY', ''),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET', ''),
        'base_url' => env('STRIPE_BASE_URL', 'https://api.stripe.com'),
    ],

];
