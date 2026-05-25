<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DiplomeType;
use App\Models\Groupe;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds realistic trainees for each group.
 */
class StagiaireSeeder extends Seeder
{
    /**
     * Seed the trainee table.
     */
    public function run(): void
    {
        $diplomeTypes = DiplomeType::query()->get();
        $gestionnaire = User::role('gestionnaire')->first();

        if ($diplomeTypes->isEmpty()) {
            return;
        }

        Groupe::query()->each(function (Groupe $groupe) use ($diplomeTypes, $gestionnaire): void {
            if ($groupe->stagiaires()->exists()) {
                return;
            }

            $total = min($groupe->capacite ?? 18, 18);

            for ($index = 0; $index < $total; $index++) {
                Stagiaire::factory()->create([
                    'groupe_id' => $groupe->id,
                    'diplome_type_id' => $diplomeTypes->random()->id,
                    'created_by' => $gestionnaire?->id,
                ]);
            }
        });
    }
}
