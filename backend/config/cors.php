<?php

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    // Comma-separated public frontend origins. This must not include /api.
    'allowed_origins' => array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173'))
    )),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // The application authenticates API calls with bearer tokens, not cookies.
    'supports_credentials' => false,
];
