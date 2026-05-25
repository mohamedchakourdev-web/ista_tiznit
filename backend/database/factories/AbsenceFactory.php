<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AbsenceTypeEnum;
use App\Enums\PeriodeEnum;
use App\Models\Absence;
use App\Models\Stagiaire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Absence>
 */
class AbsenceFactory extends Factory
{
    /**
     * The name of the corresponding model.
     *
     * @var class-string<Absence>
     */
    protected $model = Absence::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement([
            AbsenceTypeEnum::Absence,
            AbsenceTypeEnum::Absence,
            AbsenceTypeEnum::Retard,
        ]);

        return [
            'stagiaire_id' => Stagiaire::factory(),
            'groupe_id' => static function (array $attributes): int {
                return Stagiaire::query()->findOrFail($attributes['stagiaire_id'])->groupe_id;
            },
            'date_absence' => fake()->dateTimeBetween('-30 days', 'now'),
            'periode' => fake()->randomElement(PeriodeEnum::cases()),
            'type' => $type,
            'minutes_retard' => $type === AbsenceTypeEnum::Retard ? fake()->numberBetween(5, 90) : null,
            'remarque' => fake()->optional(0.45)->sentence(),
            'created_by' => null,
            'updated_by' => null,
            'deleted_by' => null,
        ];
    }

    /**
     * Set the entry as a lateness.
     */
    public function retard(): static
    {
        return $this->state(fn (): array => [
            'type' => AbsenceTypeEnum::Retard,
            'minutes_retard' => fake()->numberBetween(5, 90),
        ]);
    }

    /**
     * Set the entry as an absence.
     */
    public function absence(): static
    {
        return $this->state(fn (): array => [
            'type' => AbsenceTypeEnum::Absence,
            'minutes_retard' => null,
        ]);
    }
}
