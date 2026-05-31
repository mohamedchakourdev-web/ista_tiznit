<?php

declare(strict_types=1);

namespace Tests\Feature\Management;

use App\Models\Filiere;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FiliereCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_gestionnaire_can_manage_filieres(): void
    {
        $this->actingAsGestionnaire();

        $createResponse = $this->postJson('/api/gestionnaire/filieres', [
            'nom' => 'Developpement Digital',
            'code' => 'DD-TEST',
            'description' => 'Filiere de test.',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nom', 'Developpement Digital')
            ->assertJsonPath('data.code', 'DD-TEST');

        $filiereId = (int) $createResponse->json('data.id');

        $this->getJson('/api/gestionnaire/filieres')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->getJson("/api/gestionnaire/filieres/{$filiereId}")
            ->assertOk()
            ->assertJsonPath('data.id', $filiereId);

        $this->putJson("/api/gestionnaire/filieres/{$filiereId}", [
            'nom' => 'Developpement Digital Option Web',
            'code' => 'DD-WEB',
            'description' => 'Filiere modifiee.',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nom', 'Developpement Digital Option Web')
            ->assertJsonPath('data.code', 'DD-WEB');

        $this->deleteJson("/api/gestionnaire/filieres/{$filiereId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('filieres', [
            'id' => $filiereId,
        ]);
    }

    public function test_directeur_can_access_gestionnaire_filieres(): void
    {
        $this->actingAsDirector();

        Filiere::factory()->create();

        $this->getJson('/api/gestionnaire/filieres')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    private function actingAsGestionnaire(): User
    {
        $this->seed(RolePermissionSeeder::class);

        $gestionnaire = User::factory()->gestionnaire()->create([
            'email' => 'gestionnaire.test@example.test',
        ]);
        $gestionnaire->assignRole('gestionnaire');

        Sanctum::actingAs($gestionnaire);

        return $gestionnaire;
    }

    private function actingAsDirector(): User
    {
        $this->seed(RolePermissionSeeder::class);

        $director = User::factory()->directeur()->create([
            'email' => 'directeur.filieres@example.test',
        ]);
        $director->assignRole('directeur');

        Sanctum::actingAs($director);

        return $director;
    }
}
