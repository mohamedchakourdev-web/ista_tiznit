<?php

declare(strict_types=1);

namespace Tests\Feature\Management;

use App\Enums\PeriodeEnum;
use App\Models\Absence;
use App\Models\Autorisation;
use App\Models\Notification;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AutorisationDetailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_gestionnaire_autorisation_detail_exposes_absence_date_and_period(): void
    {
        $user = $this->actingAsGestionnaire();
        $autorisation = $this->createAutorisationWithAbsence($user);

        $this->getJson("/api/gestionnaire/autorisations/{$autorisation->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.date_absence', '2026-06-01')
            ->assertJsonPath('data.periode', PeriodeEnum::Matin->value)
            ->assertJsonPath('data.absence.date_absence', '2026-06-01')
            ->assertJsonPath('data.absence.periode', PeriodeEnum::Matin->value);
    }

    public function test_notification_detail_exposes_nested_autorisation_absence_fields(): void
    {
        $user = $this->actingAsGestionnaire();
        $autorisation = $this->createAutorisationWithAbsence($user);
        $notification = $this->createAutorisationNotification($user, $autorisation);

        $this->getJson("/api/notifications/{$notification->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.autorisation.date_absence', '2026-06-01')
            ->assertJsonPath('data.autorisation.periode', PeriodeEnum::Matin->value)
            ->assertJsonPath('data.autorisation.absence.date_absence', '2026-06-01')
            ->assertJsonPath('data.autorisation.absence.periode', PeriodeEnum::Matin->value);
    }

    private function createAutorisationWithAbsence(User $creator): Autorisation
    {
        $absence = Absence::factory()->create([
            'date_absence' => '2026-06-01',
            'periode' => PeriodeEnum::Matin->value,
        ]);

        $targetUser = User::factory()->formateur()->create();

        $autorisation = Autorisation::factory()->create([
            'stagiaire_id' => $absence->stagiaire_id,
            'target_user_id' => $targetUser->id,
            'created_by' => $creator->id,
        ]);

        $absence->update(['autorisation_id' => $autorisation->id]);

        return $autorisation;
    }

    private function createAutorisationNotification(User $recipient, Autorisation $autorisation): Notification
    {
        return Notification::factory()->create([
            'user_id' => $recipient->id,
            'autorisation_id' => $autorisation->id,
            'type' => 'autorisation',
            'title' => 'Nouvelle autorisation',
            'message' => 'Autorisation de test.',
            'is_read' => false,
            'read_at' => null,
        ]);
    }

    private function actingAsGestionnaire(): User
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->gestionnaire()->create([
            'email' => 'gestionnaire.autorisations@example.test',
        ]);

        $user->assignRole('gestionnaire');

        Sanctum::actingAs($user);

        return $user;
    }
}
