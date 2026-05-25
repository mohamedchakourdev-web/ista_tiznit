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
        Schema::create('groupes', static function (Blueprint $table): void {
            $table->id();
            $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
            $table->string('nom', 120);
            $table->string('code', 60)->unique();
            $table->string('annee_formation', 20);
            $table->string('niveau', 50);
            $table->unsignedSmallInteger('capacite')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['filiere_id', 'annee_formation']);
            $table->index('niveau');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('groupes');
    }
};
