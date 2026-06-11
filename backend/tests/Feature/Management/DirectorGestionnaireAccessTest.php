<?php

declare(strict_types=1);

namespace Tests\Feature\Management;

use App\Enums\AbsenceTypeEnum;
use App\Enums\PeriodeEnum;
use App\Enums\SexeEnum;
use App\Models\DiplomeType;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DirectorGestionnaireAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_directeur_can_manage_business_modules_from_gestionnaire_routes(): void
    {
        $this->actingAsRole('directeur');

        $this->assertCanManageBusinessModules('DIR');
        $this->postJson('/api/gestionnaire/stagiaires/import', [])
            ->assertUnprocessable();
    }

    public function test_gestionnaire_can_manage_business_modules(): void
    {
        $this->actingAsRole('gestionnaire');

        $this->assertCanManageBusinessModules('GES');
    }

    private function assertCanManageBusinessModules(string $prefix): void
    {
        $filiereId = $this->createUpdateDeleteFiliere($prefix);

        $this->assertSoftDeleted('filieres', [
            'id' => $filiereId,
        ]);

        $filiere = Filiere::factory()->create();
        $groupeId = $this->createUpdateDeleteGroupe($prefix, $filiere->id);

        $this->assertSoftDeleted('groupes', [
            'id' => $groupeId,
        ]);

        $groupe = Groupe::factory()->create([
            'filiere_id' => $filiere->id,
        ]);
        $diplomeType = DiplomeType::factory()->create();

        $stagiaireId = $this->createUpdateStagiaire($prefix, $groupe->id, $diplomeType->id);

        $this->createUpdateAbsence($stagiaireId, $groupe->id);
    }

    private function createUpdateDeleteFiliere(string $prefix): int
    {
        $createResponse = $this->postJson('/api/gestionnaire/filieres', [
            'nom' => "Filiere {$prefix}",
            'code' => "FIL-{$prefix}",
            'description' => 'Filiere de verification.',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', "FIL-{$prefix}");

        $filiereId = (int) $createResponse->json('data.id');

        $this->putJson("/api/gestionnaire/filieres/{$filiereId}", [
            'nom' => "Filiere {$prefix} modifiee",
            'code' => "FIL-{$prefix}-UP",
            'description' => 'Filiere modifiee.',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', "FIL-{$prefix}-UP");

        $this->deleteJson("/api/gestionnaire/filieres/{$filiereId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        return $filiereId;
    }

    private function createUpdateDeleteGroupe(string $prefix, int $filiereId): int
    {
        $createResponse = $this->postJson('/api/gestionnaire/groupes', [
            'filiere_id' => $filiereId,
            'nom' => "Groupe {$prefix}",
            'code' => "GRP-{$prefix}",
            'annee_formation' => '2026',
            'niveau' => '1ère année',
            'capacite' => 30,
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', "GRP-{$prefix}");

        $groupeId = (int) $createResponse->json('data.id');

        $this->patchJson("/api/gestionnaire/groupes/{$groupeId}", [
            'nom' => "Groupe {$prefix} modifie",
            'code' => "GRP-{$prefix}-UP",
            'capacite' => 28,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', "GRP-{$prefix}-UP");

        $this->deleteJson("/api/gestionnaire/groupes/{$groupeId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        return $groupeId;
    }

    private function createUpdateStagiaire(string $prefix, int $groupeId, int $diplomeTypeId): int
    {
        $createResponse = $this->postJson('/api/gestionnaire/stagiaires', [
            'groupe_id' => $groupeId,
            'diplome_type_id' => $diplomeTypeId,
            'cef' => "{$prefix}10000001",
            'nom' => "Nom {$prefix}",
            'prenom' => "Prenom {$prefix}",
            'cin' => "{$prefix}123456",
            'email' => strtolower($prefix).'stagiaire@example.test',
            'telephone' => '0612345678',
            'date_naissance' => '2003-01-15',
            'adresse' => 'Adresse de test',
            'ville' => 'Casablanca',
            'sexe' => SexeEnum::Homme->value,
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.cef', "{$prefix}10000001");

        $stagiaireId = (int) $createResponse->json('data.id');

        $this->patchJson("/api/gestionnaire/stagiaires/{$stagiaireId}", [
            'prenom' => "Prenom {$prefix} modifie",
            'telephone' => '0699999999',
            'sexe' => SexeEnum::Femme->value,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.prenom', "Prenom {$prefix} modifie");

        return $stagiaireId;
    }

    private function createUpdateAbsence(int $stagiaireId, int $groupeId): void
    {
        $createResponse = $this->postJson('/api/gestionnaire/absences', [
            'stagiaire_id' => $stagiaireId,
            'groupe_id' => $groupeId,
            'date_absence' => '2026-05-01',
            'periode' => PeriodeEnum::Matin->value,
            'type' => AbsenceTypeEnum::Absence->value,
            'remarque' => 'Absence de verification.',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.type', AbsenceTypeEnum::Absence->value);

        $absenceId = (int) $createResponse->json('data.id');

        $this->patchJson("/api/gestionnaire/absences/{$absenceId}", [
            'stagiaire_id' => $stagiaireId,
            'groupe_id' => $groupeId,
            'date_absence' => '2026-05-02',
            'periode' => PeriodeEnum::ApresMidi->value,
            'type' => AbsenceTypeEnum::Retard->value,
            'minutes_retard' => 20,
            'remarque' => 'Retard de verification.',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.type', AbsenceTypeEnum::Retard->value)
            ->assertJsonPath('data.minutes_retard', 20);
    }

    private function actingAsRole(string $role): User
    {
        $this->seed(RolePermissionSeeder::class);

        $user = $role === 'directeur'
            ? User::factory()->directeur()->create(['email' => 'directeur.management@example.test'])
            : User::factory()->gestionnaire()->create(['email' => 'gestionnaire.management@example.test']);

        $user->assignRole($role);

        Sanctum::actingAs($user);

        return $user;
    }
}
