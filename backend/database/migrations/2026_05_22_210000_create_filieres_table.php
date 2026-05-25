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
        Schema::create('filieres', static function (Blueprint $table): void {
            $table->id();
            $table->string('nom', 150);
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('nom');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('filieres');
    }
};
