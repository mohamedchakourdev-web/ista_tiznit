<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AutorisationStatutEnum;
use App\Models\Absence;
use App\Models\Autorisation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Autorisation>
 */
class AutorisationFactory extends Factory
{
    /**
     * The name of the corresponding model.
     *
     * @var class-string<Autorisation>
     */
    protected $model = Autorisation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'absence_id' => Absence::factory(),
            'target_user_id' => static function (array $attributes): int {
                $absence = Absence::query()
                    ->with('groupe.formateurs')
                    ->findOrFail($attributes['absence_id']);

                if ($absence->groupe->formateurs->isNotEmpty()) {
                    return $absence->groupe->formateurs->random()->id;
                }

                return User::factory()->formateur()->create()->id;
            },
            'code' => 'AUT-'.strtoupper(fake()->unique()->bothify('######??')),
            'motif' => fake()->optional(0.6)->sentence(10),
            'statut' => AutorisationStatutEnum::EnAttente,
            'date_validation' => null,
            'validated_by' => null,
            'is_read' => false,
            'read_at' => null,
            'read_by' => null,
            'created_by' => null,
            'updated_by' => null,
            'deleted_by' => null,
        ];
    }

    /**
     * Mark the authorization as pending.
     */
    public function enAttente(): static
    {
        return $this->state(fn (): array => [
            'statut' => AutorisationStatutEnum::EnAttente,
            'date_validation' => null,
            'validated_by' => null,
        ]);
    }

    /**
     * Mark the authorization as approved.
     */
    public function validee(?int $validatedBy = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'statut' => AutorisationStatutEnum::Validee,
            'date_validation' => now()->subHours(fake()->numberBetween(1, 48)),
            'validated_by' => $validatedBy ?? $attributes['target_user_id'] ?? null,
            'updated_by' => $validatedBy ?? $attributes['target_user_id'] ?? null,
        ]);
    }

    /**
     * Mark the authorization as refused.
     */
    public function refusee(?int $validatedBy = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'statut' => AutorisationStatutEnum::Refusee,
            'date_validation' => now()->subHours(fake()->numberBetween(1, 48)),
            'validated_by' => $validatedBy ?? $attributes['target_user_id'] ?? null,
            'updated_by' => $validatedBy ?? $attributes['target_user_id'] ?? null,
        ]);
    }
}
