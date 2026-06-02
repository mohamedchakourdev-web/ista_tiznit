<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AbsenceTypeEnum;
use App\Enums\AutorisationStatutEnum;
use App\Enums\PeriodeEnum;
use App\Models\Absence;
use App\Models\Autorisation;
use App\Models\Groupe;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds absences, authorizations, and operational notifications.
 */
class AbsenceSeeder extends Seeder
{
    /**
     * Seed absences and related workflow data.
     */
    public function run(): void
    {
        if (Absence::query()->exists()) {
            return;
        }

        $gestionnaire = User::role('gestionnaire')->first();

        Groupe::query()
            ->with(['stagiaires', 'formateurs'])
            ->get()
            ->each(function (Groupe $groupe) use ($gestionnaire): void {
                if ($groupe->stagiaires->isEmpty()) {
                    return;
                }

                $impactedStagiaires = $groupe->stagiaires
                    ->shuffle()
                    ->take(max(1, (int) ceil($groupe->stagiaires->count() * 0.35)));

                foreach ($impactedStagiaires as $stagiaire) {
                    $createdSlots = [];
                    $recordsToCreate = random_int(1, 3);

                    for ($index = 0; $index < $recordsToCreate; $index++) {
                        $slot = $this->resolveUniqueSlot($createdSlots);

                        if ($slot === null) {
                            continue;
                        }

                        [$dateAbsence, $periode] = $slot;
                        $type = fake()->randomElement([
                            AbsenceTypeEnum::Absence,
                            AbsenceTypeEnum::Absence,
                            AbsenceTypeEnum::Retard,
                        ]);

                        /** @var Absence $absence */
                        $absence = Absence::factory()->create([
                            'stagiaire_id' => $stagiaire->id,
                            'groupe_id' => $groupe->id,
                            'date_absence' => $dateAbsence,
                            'periode' => $periode,
                            'type' => $type,
                            'minutes_retard' => $type === AbsenceTypeEnum::Retard
                                ? random_int(5, 45)
                                : null,
                            'created_by' => $gestionnaire?->id,
                        ]);

                        if ($groupe->formateurs->isNotEmpty() && fake()->boolean(45)) {
                            $targetUser = $groupe->formateurs->random();
                            $statut = fake()->randomElement([
                                AutorisationStatutEnum::EnAttente,
                                AutorisationStatutEnum::EnAttente,
                                AutorisationStatutEnum::Validee,
                                AutorisationStatutEnum::Refusee,
                            ]);
                            $isRead = $statut !== AutorisationStatutEnum::EnAttente && fake()->boolean(70);

                            $autorisation = Autorisation::factory()->create([
                                'stagiaire_id' => $stagiaire->id,
                                'target_user_id' => $targetUser->id,
                                'statut' => $statut,
                                'date_validation' => $statut === AutorisationStatutEnum::EnAttente
                                    ? null
                                    : now()->subHours(random_int(2, 36)),
                                'validated_by' => $statut === AutorisationStatutEnum::EnAttente
                                    ? null
                                    : $targetUser->id,
                                'is_read' => $isRead,
                                'read_at' => $isRead ? now()->subHours(random_int(1, 12)) : null,
                                'read_by' => $isRead ? $targetUser->id : null,
                                'created_by' => $gestionnaire?->id,
                                'updated_by' => $statut === AutorisationStatutEnum::EnAttente ? null : $targetUser->id,
                            ]);

                            $absence->update(['autorisation_id' => $autorisation->id]);

                            Notification::factory()->create([
                                'user_id' => $targetUser->id,
                                'autorisation_id' => $autorisation->id,
                                'type' => 'autorisation',
                                'title' => 'Autorisation en attente',
                                'message' => sprintf(
                                    'Une autorisation %s est liee a l absence du %s pour %s %s.',
                                    $autorisation->code,
                                    $absence->date_absence->format('Y-m-d'),
                                    $stagiaire->prenom,
                                    $stagiaire->nom,
                                ),
                                'is_read' => $isRead,
                                'read_at' => $isRead ? now()->subHours(random_int(1, 12)) : null,
                            ]);
                        }
                    }
                }
            });
    }

    /**
     * Resolve a unique absence slot for a trainee.
     *
     * @param array<string, bool> $createdSlots
     * @return array{0: string, 1: PeriodeEnum}|null
     */
    private function resolveUniqueSlot(array &$createdSlots): ?array
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $date = now()->subDays(random_int(0, 20))->toDateString();
            $periode = fake()->randomElement(PeriodeEnum::cases());
            $key = $date.'|'.$periode->value;

            if (! array_key_exists($key, $createdSlots)) {
                $createdSlots[$key] = true;

                return [$date, $periode];
            }
        }

        return null;
    }
}
