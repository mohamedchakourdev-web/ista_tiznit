<?php

declare(strict_types=1);

use App\Enums\AbsenceTypeEnum;
use App\Enums\PeriodeEnum;
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
        Schema::create('absences', static function (Blueprint $table): void {
            $table->id();
            $table->foreignId('stagiaire_id')->constrained()->cascadeOnDelete();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->date('date_absence');
            $table->enum('periode', array_column(PeriodeEnum::cases(), 'value'));
            $table->enum('type', array_column(AbsenceTypeEnum::cases(), 'value'));
            $table->unsignedSmallInteger('minutes_retard')->nullable();
            $table->text('remarque')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['stagiaire_id', 'date_absence', 'periode'], 'absences_unique_presence_slot');
            $table->index(['groupe_id', 'date_absence']);
            $table->index(['type', 'date_absence']);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement(
                <<<'SQL'
                ALTER TABLE absences
                ADD CONSTRAINT chk_absences_minutes_retard
                CHECK (
                    (`type` = 'retard' AND `minutes_retard` IS NOT NULL AND `minutes_retard` > 0)
                    OR (`type` = 'absence' AND `minutes_retard` IS NULL)
                )
                SQL
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absences');
    }
};
