<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\FormateurTypeEnum;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $prenom = fake()->firstName();
        $nom = fake()->lastName();

        return [
            'nom' => $nom,
            'prenom' => $prenom,
            'email' => fake()->unique()->safeEmail(),
            'telephone' => fake()->optional(0.8)->numerify('06########'),
            'avatar' => fake()->optional(0.25)->imageUrl(400, 400, 'people'),
            'password' => static::$password ??= 'Password@123',
            'type' => fake()->optional(0.55)->randomElement(FormateurTypeEnum::cases()),
            'last_login_at' => fake()->optional(0.65)->dateTimeBetween('-30 days', 'now'),
            'is_active' => fake()->boolean(92),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Create a director profile.
     */
    public function directeur(): static
    {
        return $this->state(fn (): array => [
            'type' => null,
            'is_active' => true,
        ]);
    }

    /**
     * Create a manager profile.
     */
    public function gestionnaire(): static
    {
        return $this->state(fn (): array => [
            'type' => null,
            'is_active' => true,
        ]);
    }

    /**
     * Create a trainer profile.
     */
    public function formateur(?FormateurTypeEnum $type = null): static
    {
        return $this->state(fn (): array => [
            'type' => $type ?? fake()->randomElement(FormateurTypeEnum::cases()),
            'is_active' => true,
        ]);
    }

    /**
     * Create an inactive user.
     */
    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'is_active' => false,
            'last_login_at' => null,
        ]);
    }
}
