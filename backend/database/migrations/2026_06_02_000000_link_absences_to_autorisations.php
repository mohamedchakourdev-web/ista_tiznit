<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Move the absence <-> authorization link to the "many" side.
 *
 * An authorization may now cover several absences while an absence is still
 * justified by at most one authorization. The single source of truth becomes
 * `absences.autorisation_id`; the legacy `autorisations.absence_id` column is
 * backfilled and then dropped so no parallel link mechanism remains.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('absences', 'autorisation_id')) {
            Schema::table('absences', static function (Blueprint $table): void {
                $table->foreignId('autorisation_id')
                    ->nullable()
                    ->after('groupe_id')
                    ->constrained()
                    ->nullOnDelete();
            });
        }

        // Backfill the new column from the legacy link before dropping it.
        if (Schema::hasColumn('autorisations', 'absence_id')) {
            DB::table('autorisations')
                ->whereNotNull('absence_id')
                ->orderBy('id')
                ->get(['id', 'absence_id'])
                ->each(function (object $autorisation): void {
                    DB::table('absences')
                        ->where('id', $autorisation->absence_id)
                        ->whereNull('autorisation_id')
                        ->update(['autorisation_id' => $autorisation->id]);
                });

            Schema::table('autorisations', static function (Blueprint $table): void {
                $table->dropForeign(['absence_id']);
                $table->dropUnique(['absence_id']);
                $table->dropColumn('absence_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * Restores the legacy single-absence link. Authorizations covering several
     * absences are flattened to their primary (smallest id) absence on rollback.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('autorisations', 'absence_id')) {
            Schema::table('autorisations', static function (Blueprint $table): void {
                $table->foreignId('absence_id')
                    ->nullable()
                    ->after('id')
                    ->unique()
                    ->constrained()
                    ->cascadeOnDelete();
            });
        }

        if (Schema::hasColumn('absences', 'autorisation_id')) {
            DB::table('absences')
                ->whereNotNull('autorisation_id')
                ->orderBy('id')
                ->get(['id', 'autorisation_id'])
                ->groupBy('autorisation_id')
                ->each(function ($absences, $autorisationId): void {
                    $primaryAbsenceId = $absences->min('id');

                    DB::table('autorisations')
                        ->where('id', $autorisationId)
                        ->update(['absence_id' => $primaryAbsenceId]);
                });

            Schema::table('absences', static function (Blueprint $table): void {
                $table->dropConstrainedForeignId('autorisation_id');
            });
        }
    }
};
