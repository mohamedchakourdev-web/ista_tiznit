<?php

declare(strict_types=1);

use App\Enums\SexeEnum;
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
        Schema::create('stagiaires', static function (Blueprint $table): void {
            $table->id();
            $table->foreignId('groupe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('diplome_type_id')->constrained()->cascadeOnDelete();
            $table->string('cef', 30)->unique();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('cin', 30)->unique();
            $table->string('email')->nullable();
            $table->string('telephone', 30)->nullable();
            $table->date('date_naissance')->nullable();
            $table->string('adresse')->nullable();
            $table->string('ville', 100)->nullable();
            $table->string('photo')->nullable();
            $table->enum('sexe', array_column(SexeEnum::cases(), 'value'));
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index('groupe_id');
            $table->index(['nom', 'prenom']);
            $table->index(['diplome_type_id', 'groupe_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stagiaires');
    }
};
