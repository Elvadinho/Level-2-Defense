<?php

return [
    'name' => 'Payment',

    /*
    |--------------------------------------------------------------------------
    | Default Payment Gateway Driver
    |--------------------------------------------------------------------------
    |
    | Supported: "notchpay", "flutterwave", "paystack", "stripe"
    |
    */
    'default' => env('PAYMENT_DEFAULT_GATEWAY', 'notchpay'),
];
