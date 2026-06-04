<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('ofppt:cleanup-demo-data', function () {
    $tables = [
        'notifications' => 'notifications',
        'absences' => 'absences',
        'autorisations' => 'autorisations',
        'formateur_groupes' => 'formateur_groupes',
        'stagiaires' => 'stagiaires',
        'groupes' => 'groupes',
        'filieres' => 'filieres',
    ];

    $report = [];

    DB::transaction(function () use (&$report, $tables): void {
        foreach ($tables as $label => $table) {
            if (! Schema::hasTable($table)) {
                $report[$label] = 0;

                continue;
            }

            $report[$label] = DB::table($table)->count();
            DB::table($table)->delete();
        }
    });

    $this->info('Nettoyage des donnees de demonstration termine.');

    foreach ($report as $table => $count) {
        $this->line(sprintf('- %s: %d enregistrements supprimes', $table, $count));
    }
})->purpose('Delete demo business data while keeping system users, roles, permissions, and reference tables.');
