<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Seeds learner groups and trainer assignments.
 */
class GroupeSeeder extends Seeder
{
    /**
     * Seed the learner groups.
     */
    public function run(): void
    {
        $anneeFormation = sprintf('%s-%s', now()->year, now()->addYear()->year);
        $definitions = [
            'DD-OWFS' => [
                ['nom' => 'DD OWFS 1A', 'code' => 'DDOWFS-1A', 'niveau' => '1ere annee', 'capacite' => 30],
                ['nom' => 'DD OWFS 2A', 'code' => 'DDOWFS-2A', 'niveau' => '2eme annee', 'capacite' => 28],
            ],
            'DD-OAM' => [
                ['nom' => 'DD OAM 1A', 'code' => 'DDOAM-1A', 'niveau' => '1ere annee', 'capacite' => 26],
                ['nom' => 'DD OAM 2A', 'code' => 'DDOAM-2A', 'niveau' => '2eme annee', 'capacite' => 24],
            ],
            'ID' => [
                ['nom' => 'Infrastructure 1A', 'code' => 'ID-1A', 'niveau' => '1ere annee', 'capacite' => 32],
                ['nom' => 'Infrastructure 2A', 'code' => 'ID-2A', 'niveau' => '2eme annee', 'capacite' => 30],
            ],
            'GE' => [
                ['nom' => 'Gestion 1A', 'code' => 'GE-1A', 'niveau' => '1ere annee', 'capacite' => 30],
                ['nom' => 'Gestion 2A', 'code' => 'GE-2A', 'niveau' => '2eme annee', 'capacite' => 30],
            ],
            'ESA' => [
                ['nom' => 'ESA 1A', 'code' => 'ESA-1A', 'niveau' => '1ere annee', 'capacite' => 24],
                ['nom' => 'ESA 2A', 'code' => 'ESA-2A', 'niveau' => '2eme annee', 'capacite' => 24],
            ],
        ];

        /** @var Collection<int, User> $formateurs */
        $formateurs = User::role('formateur')->get();

        if ($formateurs->isEmpty()) {
            return;
        }

        foreach ($definitions as $filiereCode => $groupes) {
            $filiere = Filiere::query()->where('code', $filiereCode)->first();

            if ($filiere === null) {
                continue;
            }

            foreach ($groupes as $index => $definition) {
                /** @var Groupe $groupe */
                $groupe = Groupe::query()->updateOrCreate(
                    ['code' => $definition['code']],
                    [
                        'filiere_id' => $filiere->id,
                        'nom' => $definition['nom'],
                        'annee_formation' => $anneeFormation,
                        'niveau' => $definition['niveau'],
                        'capacite' => $definition['capacite'],
                    ]
                );

                $selectedFormateurs = $formateurs->shuffle()->take(min($index + 1, 2));
                $syncPayload = [];

                foreach ($selectedFormateurs as $formateur) {
                    $syncPayload[$formateur->id] = [
                        'assigned_at' => now()->subDays(random_int(7, 90)),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                $groupe->formateurs()->sync($syncPayload);
            }
        }
    }
}
