<?php

declare(strict_types=1);

namespace Tests\Feature\Management;

use App\Models\Absence;
use App\Models\DiplomeType;
use App\Models\Filiere;
use App\Models\Stagiaire;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GroupeFormateurAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_gestionnaire_can_create_update_and_expose_groupe_formateur_assignments(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $gestionnaire = User::factory()->gestionnaire()->create([
            'email' => 'gestionnaire.groupes@example.test',
        ]);
        $gestionnaire->assignRole('gestionnaire');

        $ahmed = $this->createFormateur('Ahmed', 'Alaoui', 'ahmed.alaoui@example.test');
        $youssef = $this->createFormateur('Youssef', 'Benali', 'youssef.benali@example.test');
        $fatima = $this->createFormateur('Fatima', 'El Fassi', 'fatima.elfassi@example.test');

        $filiere = Filiere::factory()->create([
            'nom' => 'Developpement Digital',
            'code' => 'DD',
        ]);

        Sanctum::actingAs($gestionnaire);

        $this->getJson('/api/gestionnaire/formateurs?per_page=100')
            ->assertOk()
            ->assertJsonFragment(['id' => $ahmed->id, 'nom' => 'Ahmed'])
            ->assertJsonFragment(['id' => $youssef->id, 'nom' => 'Youssef'])
            ->assertJsonFragment(['id' => $fatima->id, 'nom' => 'Fatima']);

        $createResponse = $this->postJson('/api/gestionnaire/groupes', [
            'filiere_id' => $filiere->id,
            'nom' => 'DD OWFS 2A',
            'code' => 'DD-OWFS-2A',
            'annee_formation' => '2025/2026',
            'niveau' => '2A',
            'capacite' => 30,
            'formateur_ids' => [$ahmed->id, $youssef->id],
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nom', 'DD OWFS 2A')
            ->assertJsonCount(2, 'data.formateurs')
            ->assertJsonFragment(['id' => $ahmed->id, 'nom' => 'Ahmed'])
            ->assertJsonFragment(['id' => $youssef->id, 'nom' => 'Youssef']);

        $groupeId = (int) $createResponse->json('data.id');

        $this->assertDatabaseHas('formateur_groupes', [
            'groupe_id' => $groupeId,
            'user_id' => $ahmed->id,
        ]);
        $this->assertDatabaseHas('formateur_groupes', [
            'groupe_id' => $groupeId,
            'user_id' => $youssef->id,
        ]);
        $this->assertDatabaseMissing('formateur_groupes', [
            'groupe_id' => $groupeId,
            'user_id' => $fatima->id,
        ]);

        $this->patchJson("/api/gestionnaire/groupes/{$groupeId}", [
            'formateur_ids' => [$ahmed->id, $youssef->id, $fatima->id],
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data.formateurs')
            ->assertJsonFragment(['id' => $fatima->id, 'nom' => 'Fatima']);

        $this->assertSame(
            3,
            DB::table('formateur_groupes')->where('groupe_id', $groupeId)->count(),
        );
        $this->assertDatabaseHas('formateur_groupes', [
            'groupe_id' => $groupeId,
            'user_id' => $fatima->id,
        ]);

        $diplomeType = DiplomeType::factory()->create();
        $stagiaire = Stagiaire::factory()->create([
            'groupe_id' => $groupeId,
            'diplome_type_id' => $diplomeType->id,
            'nom' => 'El Amrani',
            'prenom' => 'Salma',
        ]);
        $absence = Absence::factory()->absence()->create([
            'stagiaire_id' => $stagiaire->id,
            'groupe_id' => $groupeId,
        ]);

        Sanctum::actingAs($ahmed);

        $this->getJson('/api/formateur/groupes')
            ->assertOk()
            ->assertJsonFragment(['id' => $groupeId, 'nom' => 'DD OWFS 2A']);

        $this->getJson('/api/formateur/stagiaires')
            ->assertOk()
            ->assertJsonFragment(['id' => $stagiaire->id, 'nom' => 'El Amrani']);

        $this->getJson('/api/formateur/absences')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $absence->id,
                'groupe_id' => $groupeId,
                'stagiaire_id' => $stagiaire->id,
            ]);
    }

    private function createFormateur(string $nom, string $prenom, string $email): User
    {
        $formateur = User::factory()->formateur()->create([
            'nom' => $nom,
            'prenom' => $prenom,
            'email' => $email,
        ]);
        $formateur->assignRole('formateur');

        return $formateur;
    }
}
