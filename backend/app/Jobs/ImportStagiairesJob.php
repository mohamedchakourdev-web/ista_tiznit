<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Imports\StagiairesImport;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class ImportStagiairesJob implements ShouldQueue
{
    use Queueable;

    /**
     * Maximum execution time for preparing the queued import.
     */
    public int $timeout = 1200;

    public function __construct(private readonly string $filePath) {}

    /**
     * Execute the queued import.
     */
    public function handle(): void
    {
        if (! Storage::disk('local')->exists($this->filePath)) {
            Log::warning('Fichier import stagiaires introuvable.', [
                'file' => $this->filePath,
            ]);

            return;
        }

        Log::info('Import des stagiaires demarre.', [
            'file' => $this->filePath,
        ]);

        Excel::import(new StagiairesImport, $this->filePath, 'local');

        Storage::disk('local')->delete($this->filePath);

        Log::info('Import des stagiaires termine.', [
            'file' => $this->filePath,
        ]);
    }

    /**
     * Log the job failure.
     */
    public function failed(Throwable $exception): void
    {
        Log::error('Le job d\'import des stagiaires a echoue.', [
            'file' => $this->filePath,
            'message' => $exception->getMessage(),
        ]);
    }
}
