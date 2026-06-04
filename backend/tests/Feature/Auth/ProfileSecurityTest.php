<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_directeur_gestionnaire_and_formateur_can_update_email_from_profile(): void
    {
        foreach (['directeur', 'gestionnaire', 'formateur'] as $role) {
            $user = $this->actingAsRoleUser($role, $role.'.profile@example.test');
            $newEmail = $role.'.updated@example.test';

            $this->putJson('/api/profile', [
                'nom' => 'Nom '.$role,
                'prenom' => 'Prenom '.$role,
                'email' => $newEmail,
                'telephone' => '0612345678',
            ])
                ->assertOk()
                ->assertJsonPath('success', true)
                ->assertJsonPath('data.email', $newEmail);

            $user->refresh();

            $this->assertSame($newEmail, $user->email);
        }
    }

    public function test_profile_email_must_be_unique(): void
    {
        $user = $this->actingAsRoleUser('gestionnaire', 'gestionnaire.profile@example.test');

        User::factory()->formateur()->create([
            'email' => 'existing.profile@example.test',
        ])->assignRole('formateur');

        $this->putJson('/api/profile', [
            'nom' => 'Nom Gestionnaire',
            'prenom' => 'Prenom Gestionnaire',
            'email' => 'existing.profile@example.test',
            'telephone' => '0611111111',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $user->refresh();

        $this->assertSame('gestionnaire.profile@example.test', $user->email);
    }

    public function test_profile_password_change_still_works(): void
    {
        $user = $this->actingAsRoleUser('formateur', 'formateur.password@example.test');

        $this->putJson('/api/profile/password', [
            'current_password' => 'Password@123',
            'new_password' => 'NewPassword@123',
            'new_password_confirmation' => 'NewPassword@123',
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $user->refresh();

        $this->assertTrue(Hash::check('NewPassword@123', $user->password));
    }

    private function actingAsRoleUser(string $role, string $email): User
    {
        $this->seed(RolePermissionSeeder::class);

        $user = match ($role) {
            'directeur' => User::factory()->directeur()->create(['email' => $email]),
            'gestionnaire' => User::factory()->gestionnaire()->create(['email' => $email]),
            'formateur' => User::factory()->formateur()->create(['email' => $email]),
        };

        $user->assignRole($role);

        Sanctum::actingAs($user);

        return $user;
    }
}
