<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Filiere;
use Illuminate\Database\Seeder;

/**
 * Seeds OFPPT training streams.
 */
class FiliereSeeder extends Seeder
{
    /**
     * Seed the filieres catalog.
     */
    public function run(): void
    {
        $filieres = [
            [
                'nom' => 'Developpement Digital - Option Web Full Stack',
                'code' => 'DD-OWFS',
                'description' => 'Formation dediee au developpement d applications web modernes et APIs.',
            ],
            [
                'nom' => 'Developpement Digital - Option Applications Mobiles',
                'code' => 'DD-OAM',
                'description' => 'Formation orientee vers les applications mobiles et services connectes.',
            ],
            [
                'nom' => 'Infrastructure Digitale',
                'code' => 'ID',
                'description' => 'Formation orientee systemes, reseaux et exploitation technique.',
            ],
            [
                'nom' => 'Gestion des Entreprises',
                'code' => 'GE',
                'description' => 'Formation de gestion administrative, comptable et suivi d activite.',
            ],
            [
                'nom' => 'Electromecanique des Systemes Automatisees',
                'code' => 'ESA',
                'description' => 'Formation technique autour de la maintenance et de l automatisation industrielle.',
            ],
        ];

        foreach ($filieres as $filiere) {
            Filiere::query()->updateOrCreate(
                ['code' => $filiere['code']],
                $filiere,
            );
        }
    }
}
