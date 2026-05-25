<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Filiere;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Filiere>
 */
class FiliereFactory extends Factory
{
    /**
     * The name of the corresponding model.
     *
     * @var class-string<Filiere>
     */
    protected $model = Filiere::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $code = strtoupper(fake()->unique()->bothify('FIL-###'));

        return [
            'nom' => 'Filiere '.fake()->unique()->words(2, true),
            'code' => $code,
            'description' => fake()->optional()->sentence(12),
        ];
    }
}
