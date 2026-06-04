<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Mail\TemporaryPasswordMail;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_works_for_directeur_gestionnaire_and_formateur(): void
    {
        $this->seed(RolePermissionSeeder::class);
        Mail::fake();

        $users = [
            ['role' => 'directeur', 'email' => 'directeur.reset@example.test'],
            ['role' => 'gestionnaire', 'email' => 'gestionnaire.reset@example.test'],
            ['role' => 'formateur', 'email' => 'formateur.reset@example.test'],
        ];

        foreach ($users as $definition) {
            $user = $this->createRoleUser($definition['role'], $definition['email']);
            $originalHash = $user->password;

            $this->postJson('/api/auth/forgot-password', [
                'email' => $definition['email'],
            ])
                ->assertOk()
                ->assertJsonPath('success', true);

            $user->refresh();
            $newHash = $user->password;

            $this->assertNotSame($originalHash, $newHash);

            Mail::assertSent(TemporaryPasswordMail::class, function (TemporaryPasswordMail $mail) use ($definition, $newHash): bool {
                return $mail->hasTo($definition['email'])
                    && Hash::check($mail->temporaryPassword, $newHash);
            });
        }

        Mail::assertSentCount(3);
    }

    private function createRoleUser(string $role, string $email): User
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
