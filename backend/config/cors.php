<?php

declare(strict_types=1);

$frontendUrl = trim((string) env('FRONTEND_URL', ''));

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The frontend is hosted on Vercel while the API lives on Railway, so the
    | API must explicitly allow the SPA origin.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $frontendUrl !== '' ? [$frontendUrl] : [],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
