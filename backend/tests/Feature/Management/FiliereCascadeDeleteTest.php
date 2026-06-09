<?php

declare(strict_types=1);

namespace Tests\Feature\Management;

use App\Models\Absence;
use App\Models\Autorisation;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Stagiaire;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FiliereCascadeDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_a_filiere_soft_deletes_the_whole_ownership_chain(): void
    {
        $this->actingAsGestionnaire();

        // Filiere under test, with two groupes and two stagiaires per groupe,
        // each owning one absence and one autorisation.
        $filiere = Filiere::factory()->create();
        $groupes = Groupe::factory()->count(2)->for($filiere)->create();

        $stagiaireIds = [];
        $absenceIds = [];
        $autorisationIds = [];
        $targetUserIds = [];
        $diplomeTypeIds = [];

        foreach ($groupes as $groupe) {
            foreach (Stagiaire::factory()->count(2)->for($groupe)->create() as $stagiaire) {
                $stagiaireIds[] = $stagiaire->id;
                $diplomeTypeIds[] = $stagiaire->diplome_type_id;

                $absenceIds[] = Absence::factory()->for($stagiaire)->create()->id;

                $autorisation = Autorisation::factory()->for($stagiaire)->create();
                $autorisationIds[] = $autorisation->id;
                $targetUserIds[] = $autorisation->target_user_id;
            }
        }

        // An unrelated filiere and its own chain that must stay untouched.
        $otherFiliere = Filiere::factory()->create();
        $otherGroupe = Groupe::factory()->for($otherFiliere)->create();
        $otherStagiaire = Stagiaire::factory()->for($otherGroupe)->create();
        $otherAbsence = Absence::factory()->for($otherStagiaire)->create();
        $otherAutorisation = Autorisation::factory()->for($otherStagiaire)->create();

        $this->deleteJson("/api/gestionnaire/filieres/{$filiere->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        // The filiere and every descendant are soft deleted.
        $this->assertSoftDeleted('filieres', ['id' => $filiere->id]);

        foreach ($groupes->pluck('id') as $groupeId) {
            $this->assertSoftDeleted('groupes', ['id' => $groupeId]);
        }

        foreach ($stagiaireIds as $id) {
            $this->assertSoftDeleted('stagiaires', ['id' => $id]);
        }

        foreach ($absenceIds as $id) {
            $this->assertSoftDeleted('absences', ['id' => $id]);
        }

        foreach ($autorisationIds as $id) {
            $this->assertSoftDeleted('autorisations', ['id' => $id]);
        }

        // No orphan stays active: the default soft-delete scope sees nothing.
        $this->assertSame(0, Groupe::whereIn('id', $groupes->pluck('id'))->count());
        $this->assertSame(0, Stagiaire::whereIn('id', $stagiaireIds)->count());
        $this->assertSame(0, Absence::whereIn('id', $absenceIds)->count());
        $this->assertSame(0, Autorisation::whereIn('id', $autorisationIds)->count());

        // The unrelated filiere chain is preserved.
        $this->assertNotSoftDeleted('filieres', ['id' => $otherFiliere->id]);
        $this->assertNotSoftDeleted('groupes', ['id' => $otherGroupe->id]);
        $this->assertNotSoftDeleted('stagiaires', ['id' => $otherStagiaire->id]);
        $this->assertNotSoftDeleted('absences', ['id' => $otherAbsence->id]);
        $this->assertNotSoftDeleted('autorisations', ['id' => $otherAutorisation->id]);

        // Users and diplome types are never deleted by the cascade.
        foreach (array_unique($targetUserIds) as $id) {
            $this->assertNotSoftDeleted('users', ['id' => $id]);
        }

        foreach (array_unique($diplomeTypeIds) as $id) {
            $this->assertNotSoftDeleted('diplome_types', ['id' => $id]);
        }
    }

    private function actingAsGestionnaire(): User
    {
        $this->seed(RolePermissionSeeder::class);

        $gestionnaire = User::factory()->gestionnaire()->create([
            'email' => 'gestionnaire.cascade@example.test',
        ]);
        $gestionnaire->assignRole('gestionnaire');

        Sanctum::actingAs($gestionnaire);

        return $gestionnaire;
    }
}
