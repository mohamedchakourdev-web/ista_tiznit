<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('autorisations', static function (Blueprint $table): void {
            if (! Schema::hasColumn('autorisations', 'stagiaire_id')) {
                $table->foreignId('stagiaire_id')
                    ->nullable()
                    ->after('absence_id')
                    ->constrained()
                    ->cascadeOnDelete();
            }
        });

        Schema::table('autorisations', static function (Blueprint $table): void {
            $table->foreignId('absence_id')->nullable()->change();
        });

        DB::table('autorisations')
            ->whereNull('stagiaire_id')
            ->whereNotNull('absence_id')
            ->orderBy('id')
            ->get(['id', 'absence_id'])
            ->each(function (object $autorisation): void {
                $absence = DB::table('absences')
                    ->where('id', $autorisation->absence_id)
                    ->first(['stagiaire_id']);

                if ($absence !== null) {
                    DB::table('autorisations')
                        ->where('id', $autorisation->id)
                        ->update(['stagiaire_id' => $absence->stagiaire_id]);
                }
            });

        Schema::table('autorisations', static function (Blueprint $table): void {
            $table->index(
                ['stagiaire_id', 'target_user_id'],
                'autorisations_stagiaire_target_user_index',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('autorisations', static function (Blueprint $table): void {
            $table->dropIndex('autorisations_stagiaire_target_user_index');
        });

        Schema::table('autorisations', static function (Blueprint $table): void {
            if (Schema::hasColumn('autorisations', 'stagiaire_id')) {
                $table->dropConstrainedForeignId('stagiaire_id');
            }
        });

        DB::table('autorisations')->whereNull('absence_id')->delete();

        Schema::table('autorisations', static function (Blueprint $table): void {
            $table->foreignId('absence_id')->nullable(false)->change();
        });
    }
};
