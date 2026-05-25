<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Filiere;
use App\Models\Groupe;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Groupe>
 */
class GroupeFactory extends Factory
{
    /**
     * The name of the corresponding model.
     *
     * @var class-string<Groupe>
     */
    protected $model = Groupe::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $niveau = fake()->randomElement(['1ere annee', '2eme annee']);
        $code = strtoupper(fake()->unique()->bothify('GRP-###??'));

        return [
            'filiere_id' => Filiere::factory(),
            'nom' => 'Groupe '.fake()->unique()->bothify('??-##'),
            'code' => $code,
            'annee_formation' => sprintf('%s-%s', now()->year, now()->addYear()->year),
            'niveau' => $niveau,
            'capacite' => fake()->numberBetween(24, 32),
        ];
    }
}
