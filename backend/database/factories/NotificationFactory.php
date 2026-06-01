<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    /**
     * The name of the corresponding model.
     *
     * @var class-string<Notification>
     */
    protected $model = Notification::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(['autorisation', 'absence', 'system']);
        $isRead = fake()->boolean(35);

        return [
            'user_id' => User::factory(),
            'absence_id' => null,
            'autorisation_id' => null,
            'type' => $type,
            'title' => match ($type) {
                'autorisation' => 'Nouvelle autorisation',
                'absence' => 'Nouvelle absence',
                'system' => 'Notification systeme',
            },
            'message' => fake()->sentence(14),
            'is_read' => $isRead,
            'read_at' => $isRead ? now()->subHours(fake()->numberBetween(1, 72)) : null,
        ];
    }

    /**
     * Mark the notification as unread.
     */
    public function unread(): static
    {
        return $this->state(fn (): array => [
            'is_read' => false,
            'read_at' => null,
        ]);
    }
}
