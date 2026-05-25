<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DiplomeType;
use Illuminate\Database\Seeder;

/**
 * Seeds diploma types used by trainees.
 */
class DiplomeTypeSeeder extends Seeder
{
    /**
     * Seed the diploma type reference table.
     */
    public function run(): void
    {
        $diplomeTypes = [
            [
                'nom' => 'Technicien',
                'code' => 'TECH',
                'description' => 'Niveau technicien pour les parcours techniques et metiers.',
            ],
            [
                'nom' => 'Technicien Specialise',
                'code' => 'TS',
                'description' => 'Niveau de specialisation professionnelle avance.',
            ],
            [
                'nom' => 'Qualification',
                'code' => 'QUAL',
                'description' => 'Niveau qualification pour les parcours d insertion metier.',
            ],
            [
                'nom' => 'Specialisation',
                'code' => 'SPEC',
                'description' => 'Niveau de specialisation pratique et operationnelle.',
            ],
        ];

        foreach ($diplomeTypes as $diplomeType) {
            DiplomeType::query()->updateOrCreate(
                ['code' => $diplomeType['code']],
                $diplomeType,
            );
        }
    }
}
