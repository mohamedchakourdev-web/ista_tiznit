<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\SexeEnum;
use App\Models\DiplomeType;
use App\Models\Groupe;
use App\Models\Stagiaire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Stagiaire>
 */
class StagiaireFactory extends Factory
{
    /**
     * The name of the corresponding model.
     *
     * @var class-string<Stagiaire>
     */
    protected $model = Stagiaire::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'groupe_id' => Groupe::factory(),
            'diplome_type_id' => DiplomeType::factory(),
            'cef' => fake()->unique()->numerify('1#########'),
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'cin' => strtoupper(fake()->unique()->bothify('??######')),
            'email' => fake()->optional(0.65)->safeEmail(),
            'telephone' => fake()->optional(0.75)->numerify('06########'),
            'date_naissance' => fake()->optional(0.9)->dateTimeBetween('-27 years', '-17 years'),
            'adresse' => fake()->optional(0.7)->streetAddress(),
            'ville' => fake()->optional(0.85)->randomElement([
                'Casablanca',
                'Rabat',
                'Marrakech',
                'Fes',
                'Agadir',
                'Tanger',
            ]),
            'photo' => fake()->optional(0.2)->imageUrl(400, 400, 'people'),
            'sexe' => fake()->randomElement(SexeEnum::cases()),
            'created_by' => null,
            'updated_by' => null,
            'deleted_by' => null,
        ];
    }
}
