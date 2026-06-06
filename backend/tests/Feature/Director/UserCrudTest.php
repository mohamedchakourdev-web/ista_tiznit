<?php

declare(strict_types=1);

namespace Tests\Feature\Director;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
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

    public function test_directeur_cannot_create_user_with_existing_active_email(): void
    {
        $this->actingAsDirector();

        User::factory()->gestionnaire()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->postJson('/api/directeur/users', [
            'nom' => 'Duplicate',
            'prenom' => 'User',
            'email' => 'test@example.com',
            'password' => 'Password@123',
            'role' => 'gestionnaire',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertSame(1, User::withTrashed()->where('email', 'test@example.com')->count());
    }

    public function test_recreating_user_restores_soft_deleted_account(): void
    {
        $this->actingAsDirector();

        $targetUser = User::factory()->formateur()->create([
            'nom' => 'Original',
            'prenom' => 'User',
            'email' => 'test@example.com',
            'telephone' => '0611111111',
            'is_active' => true,
        ]);
        $targetUser->assignRole('formateur');
        $targetUser->givePermissionTo(Permission::findByName('manage filieres', 'web'));

        $originalUserId = $targetUser->id;

        $this->deleteJson("/api/directeur/users/{$targetUser->id}")
            ->assertOk();

        $this->assertSoftDeleted('users', [
            'id' => $originalUserId,
            'email' => 'test@example.com',
        ]);

        $response = $this->postJson('/api/directeur/users', [
            'nom' => 'Restored',
            'prenom' => 'Account',
            'email' => 'test@example.com',
            'telephone' => '0622222222',
            'password' => 'NewPassword@123',
            'role' => 'gestionnaire',
            'type' => 'permanent',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Utilisateur restaure')
            ->assertJsonPath('data.id', $originalUserId)
            ->assertJsonPath('data.nom', 'Restored')
            ->assertJsonPath('data.prenom', 'Account')
            ->assertJsonPath('data.email', 'test@example.com')
            ->assertJsonPath('data.telephone', '0622222222')
            ->assertJsonPath('data.type', 'permanent')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.roles.0', 'formateur');

        $this->assertSame(1, User::withTrashed()->where('email', 'test@example.com')->count());

        $restoredUser = User::query()->where('email', 'test@example.com')->firstOrFail();

        $this->assertSame($originalUserId, $restoredUser->id);
        $this->assertNull($restoredUser->deleted_at);
        $this->assertTrue($restoredUser->is_active);
        $this->assertTrue(Hash::check('NewPassword@123', $restoredUser->password));
        $this->assertTrue($restoredUser->hasRole('formateur'));
        $this->assertFalse($restoredUser->hasRole('gestionnaire'));
        $this->assertTrue($restoredUser->hasPermissionTo('manage filieres'));
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

    public function test_directeur_can_list_trashed_users(): void
    {
        $this->actingAsDirector();

        $targetUser = User::factory()->gestionnaire()->create([
            'email' => 'trashed.user@example.test',
        ]);
        $targetUser->assignRole('gestionnaire');
        $targetUser->delete();

        $response = $this->getJson('/api/directeur/users/trashed');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.id', $targetUser->id)
            ->assertJsonPath('data.0.email', 'trashed.user@example.test');
    }

    public function test_directeur_can_restore_trashed_user_manually(): void
    {
        $this->actingAsDirector();

        $targetUser = User::factory()->gestionnaire()->create([
            'email' => 'manual.restore@example.test',
            'is_active' => false,
        ]);
        $targetUser->assignRole('gestionnaire');
        $targetUser->givePermissionTo(Permission::findByName('manage groupes', 'web'));
        $targetUser->delete();

        $response = $this->postJson("/api/directeur/users/{$targetUser->id}/restore");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Utilisateur restaure')
            ->assertJsonPath('data.id', $targetUser->id)
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.roles.0', 'gestionnaire');

        $targetUser->refresh();

        $this->assertNull($targetUser->deleted_at);
        $this->assertTrue($targetUser->is_active);
        $this->assertTrue($targetUser->hasRole('gestionnaire'));
        $this->assertTrue($targetUser->hasPermissionTo('manage groupes'));
    }

    public function test_directeur_can_force_delete_trashed_user(): void
    {
        $this->actingAsDirector();

        $targetUser = User::factory()->gestionnaire()->create([
            'email' => 'force.delete@example.test',
        ]);
        $targetUser->assignRole('gestionnaire');
        $targetUser->delete();

        $response = $this->deleteJson("/api/directeur/users/{$targetUser->id}/force");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Utilisateur supprime definitivement');

        $this->assertDatabaseMissing('users', [
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
