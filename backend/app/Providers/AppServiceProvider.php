<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();

        $this->ensureDeploymentStoragePaths();

        RateLimiter::for('api', static function (Request $request): Limit {
            return Limit::perMinute((int) env('API_RATE_LIMIT', 60))
                ->by((string) ($request->user()?->id ?? $request->ip()));
        });
    }

    /**
     * Ensure import, temp, and avatar directories exist on ephemeral hosts (e.g. Railway).
     */
    private function ensureDeploymentStoragePaths(): void
    {
        $paths = [
            storage_path('app/private/imports'),
            storage_path('app/temp'),
            storage_path('app/public/avatars'),
        ];

        foreach ($paths as $path) {
            if (! is_dir($path)) {
                mkdir($path, 0755, true);
            }
        }

        $tempPath = storage_path('app/temp');

        if (is_dir($tempPath)) {
            putenv('TMPDIR='.$tempPath);
            putenv('TEMP='.$tempPath);
            putenv('TMP='.$tempPath);
        }
    }
}
