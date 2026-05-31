<?php

declare(strict_types=1);

namespace Tests\Feature\Director;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_directeur_can_create_user(): void
    {
        $this->actingAsDirector();

        $response = $this->postJson('/api/directeur/users', [
            'nom' => 'Alaoui',
            'prenom' => 'Imane',
            'email' => 'imane.alaoui@example.test',
            'password' => 'Password@123',
            'role' => 'gestionnaire',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nom', 'Alaoui')
            ->assertJsonPath('data.email', 'imane.alaoui@example.test')
            ->assertJsonPath('data.roles.0', 'gestionnaire');

        $user = User::query()->where('email', 'imane.alaoui@example.test')->firstOrFail();

        $this->assertTrue(Hash::check('Password@123', $user->password));
        $this->assertTrue($user->hasRole('gestionnaire'));
    }

    public function test_directeur_can_update_user(): void
    {
        $this->actingAsDirector();

        $targetUser = User::factory()->formateur()->create([
            'email' => 'old.formateur@example.test',
        ]);
        $targetUser->assignRole('formateur');

        $response = $this->putJson("/api/directeur/users/{$targetUser->id}", [
            'nom' => 'Benali',
            'prenom' => 'Yassine',
            'email' => 'yassine.benali@example.test',
            'password' => 'NewPassword@123',
            'role' => 'gestionnaire',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nom', 'Benali')
            ->assertJsonPath('data.email', 'yassine.benali@example.test')
            ->assertJsonPath('data.roles.0', 'gestionnaire');

        $targetUser->refresh();

        $this->assertTrue(Hash::check('NewPassword@123', $targetUser->password));
        $this->assertTrue($targetUser->hasRole('gestionnaire'));
        $this->assertFalse($targetUser->hasRole('formateur'));
    }

    public function test_directeur_can_delete_user(): void
    {
        $this->actingAsDirector();

        $targetUser = User::factory()->gestionnaire()->create([
            'email' => 'delete.me@example.test',
        ]);
        $targetUser->assignRole('gestionnaire');

        $response = $this->deleteJson("/api/directeur/users/{$targetUser->id}");

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('users', [
            'id' => $targetUser->id,
        ]);
    }

    private function actingAsDirector(): User
    {
        $this->seed(RolePermissionSeeder::class);

        $director = User::factory()->directeur()->create([
            'email' => 'directeur.test@example.test',
        ]);
        $director->assignRole('directeur');

        Sanctum::actingAs($director);

        return $director;
    }
}
