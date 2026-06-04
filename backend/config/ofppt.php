<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Avatar storage disk
    |--------------------------------------------------------------------------
    |
    | Use "public" on Railway (with storage:link and optional volume on storage/).
    | Use "s3" when AWS_* variables are configured for durable object storage.
    |
    */

    'avatar_disk' => env('AVATAR_DISK', 'public'),

    /*
    |--------------------------------------------------------------------------
    | Excel import storage disk
    |--------------------------------------------------------------------------
    |
    | Imports are queued on the same Railway service as the queue worker so the
    | uploaded file remains on the shared ephemeral disk until the job finishes.
    |
    */

    'import_disk' => env('IMPORT_DISK', 'local'),

];
