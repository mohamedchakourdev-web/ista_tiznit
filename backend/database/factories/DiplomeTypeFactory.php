<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DiplomeType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiplomeType>
 */
class DiplomeTypeFactory extends Factory
{
    /**
     * The name of the corresponding model.
     *
     * @var class-string<DiplomeType>
     */
    protected $model = DiplomeType::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nom' => 'Diplome '.fake()->unique()->word(),
            'code' => strtoupper(fake()->unique()->bothify('DIP-###')),
            'description' => fake()->optional()->sentence(10),
        ];
    }
}
