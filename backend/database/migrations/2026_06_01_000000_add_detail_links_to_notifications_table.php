<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notifications', static function (Blueprint $table): void {
            $table->foreignId('absence_id')
                ->nullable()
                ->after('user_id')
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('autorisation_id')
                ->nullable()
                ->after('absence_id')
                ->constrained()
                ->nullOnDelete();

            $table->index(['absence_id', 'autorisation_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', static function (Blueprint $table): void {
            $table->dropIndex(['absence_id', 'autorisation_id']);
            $table->dropConstrainedForeignId('autorisation_id');
            $table->dropConstrainedForeignId('absence_id');
        });
    }
};
