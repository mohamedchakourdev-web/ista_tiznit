<?php

declare(strict_types=1);

namespace Tests\Feature\Formateur;

use App\Models\Autorisation;
use App\Models\Notification;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AutorisationReadStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_formateur_detail_marks_autorisation_as_read(): void
    {
        $formateur = $this->actingAsFormateur();

        $autorisation = Autorisation::factory()->create([
            'target_user_id' => $formateur->id,
            'is_read' => false,
            'read_at' => null,
            'read_by' => null,
        ]);

        $response = $this->getJson("/api/formateur/autorisations/{$autorisation->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_read', true)
            ->assertJsonPath('data.read_by', $formateur->id);

        $this->assertNotNull($response->json('data.read_at'));
        $this->assertDatabaseHas('autorisations', [
            'id' => $autorisation->id,
            'is_read' => true,
            'read_by' => $formateur->id,
        ]);
        $this->assertNotNull($autorisation->fresh()->read_at);
    }

    public function test_autorisation_notification_read_marks_linked_autorisation_as_read(): void
    {
        $formateur = $this->actingAsFormateur();

        $autorisation = Autorisation::factory()->create([
            'target_user_id' => $formateur->id,
            'is_read' => false,
            'read_at' => null,
            'read_by' => null,
        ]);

        $notification = Notification::factory()->create([
            'user_id' => $formateur->id,
            'autorisation_id' => $autorisation->id,
            'type' => 'autorisation',
            'is_read' => false,
            'read_at' => null,
        ]);

        $response = $this->postJson("/api/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_read', true)
            ->assertJsonPath('data.autorisation.is_read', true)
            ->assertJsonPath('data.autorisation.read_by', $formateur->id);

        $this->assertNotNull($response->json('data.autorisation.read_at'));
        $this->assertDatabaseHas('autorisations', [
            'id' => $autorisation->id,
            'is_read' => true,
            'read_by' => $formateur->id,
        ]);
        $this->assertNotNull($autorisation->fresh()->read_at);
    }

    private function actingAsFormateur(): User
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->formateur()->create([
            'email' => 'formateur.autorisations@example.test',
        ]);

        $user->assignRole('formateur');

        Sanctum::actingAs($user);

        return $user;
    }
}
