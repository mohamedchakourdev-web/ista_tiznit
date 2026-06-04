<?php

declare(strict_types=1);

namespace Tests\Feature\Maintenance;

use App\Enums\AbsenceTypeEnum;
use App\Enums\PeriodeEnum;
use App\Models\Absence;
use App\Models\Autorisation;
use App\Models\DiplomeType;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Notification;
use App\Models\Stagiaire;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class CleanupDemoDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_cleanup_command_deletes_demo_tables_and_keeps_system_data(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $director = $this->createSystemUser('directeur', 'directeur.system@example.test');
        $manager = $this->createSystemUser('gestionnaire', 'gestionnaire.system@example.test');
        $trainer = $this->createSystemUser('formateur', 'formateur.system@example.test');

        $filiere = Filiere::factory()->create([
            'code' => 'FIL-TEST',
            'nom' => 'Filiere test',
        ]);

        $groupe = Groupe::factory()->create([
            'filiere_id' => $filiere->id,
            'code' => 'GRP-TEST',
            'nom' => 'Groupe test',
        ]);

        $groupe->formateurs()->attach($trainer->id, [
            'assigned_at' => now(),
        ]);

        $diplomeType = DiplomeType::factory()->create([
            'code' => 'DIP-TEST',
            'nom' => 'Diplome test',
        ]);

        $stagiaire = Stagiaire::factory()->create([
            'groupe_id' => $groupe->id,
            'diplome_type_id' => $diplomeType->id,
            'cef' => '1000000001',
            'cin' => 'AA123456',
        ]);

        $autorisation = Autorisation::factory()->enAttente()->create([
            'stagiaire_id' => $stagiaire->id,
            'target_user_id' => $trainer->id,
            'code' => 'AUT-TEST',
        ]);

        $absence = Absence::factory()->absence()->create([
            'stagiaire_id' => $stagiaire->id,
            'groupe_id' => $groupe->id,
            'autorisation_id' => $autorisation->id,
            'date_absence' => '2026-06-01',
            'periode' => PeriodeEnum::Matin->value,
            'type' => AbsenceTypeEnum::Absence->value,
        ]);

        Notification::factory()->create([
            'user_id' => $trainer->id,
            'absence_id' => $absence->id,
            'autorisation_id' => $autorisation->id,
            'type' => 'autorisation',
            'title' => 'Notification test',
            'message' => 'Notification de demonstration.',
            'is_read' => false,
            'read_at' => null,
        ]);

        $exitCode = Artisan::call('ofppt:cleanup-demo-data');

        $this->assertSame(0, $exitCode);
        $this->assertDatabaseCount('notifications', 0);
        $this->assertDatabaseCount('absences', 0);
        $this->assertDatabaseCount('autorisations', 0);
        $this->assertDatabaseCount('stagiaires', 0);
        $this->assertDatabaseCount('formateur_groupes', 0);
        $this->assertDatabaseCount('groupes', 0);
        $this->assertDatabaseCount('filieres', 0);
        $this->assertDatabaseCount('users', 3);
        $this->assertDatabaseCount('roles', 3);
        $this->assertDatabaseCount('permissions', 8);

        $output = Artisan::output();

        $this->assertStringContainsString('Nettoyage des donnees de demonstration termine.', $output);
        $this->assertStringContainsString('- notifications: 1 enregistrements supprimes', $output);
        $this->assertStringContainsString('- absences: 1 enregistrements supprimes', $output);
        $this->assertStringContainsString('- autorisations: 1 enregistrements supprimes', $output);
        $this->assertStringContainsString('- formateur_groupes: 1 enregistrements supprimes', $output);
        $this->assertStringContainsString('- stagiaires: 1 enregistrements supprimes', $output);
        $this->assertStringContainsString('- groupes: 1 enregistrements supprimes', $output);
        $this->assertStringContainsString('- filieres: 1 enregistrements supprimes', $output);

        $this->assertSame($director->id, User::query()->where('email', 'directeur.system@example.test')->value('id'));
        $this->assertSame($manager->id, User::query()->where('email', 'gestionnaire.system@example.test')->value('id'));
        $this->assertSame($trainer->id, User::query()->where('email', 'formateur.system@example.test')->value('id'));
    }

    private function createSystemUser(string $role, string $email): User
    {
        $user = match ($role) {
            'directeur' => User::factory()->directeur()->create(['email' => $email]),
            'gestionnaire' => User::factory()->gestionnaire()->create(['email' => $email]),
            'formateur' => User::factory()->formateur()->create(['email' => $email]),
        };

        $user->assignRole($role);

        return $user;
    }
}
