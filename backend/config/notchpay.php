<?php
return [
    'public_key' => env('NOTCHPAY_PUBLIC_KEY', ''),
    'hash_key' => env('NOTCHPAY_HASH_KEY', ''),
    'base_url' => env('NOTCHPAY_BASE_URL', 'https://api.notchpay.co'),
    'currency' => env('NOTCHPAY_CURRENCY', 'XAF'),
    'callback_url' => env('NOTCHPAY_CALLBACK_URL', rtrim((string) env('APP_URL', 'http://localhost:8000'), '/') . '/api/payments/callback'),
];