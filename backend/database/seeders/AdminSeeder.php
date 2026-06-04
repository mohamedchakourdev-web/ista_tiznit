<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\FormateurTypeEnum;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds the core platform users.
 */
class AdminSeeder extends Seeder
{
    /**
     * Seed the application's administrative users.
     */
    public function run(): void
    {
        $users = [
            [
                'role' => 'directeur',
                'state' => 'directeur',
                'attributes' => [
                    'nom' => 'Bennani',
                    'prenom' => 'Omar',
                    'email' => 'adminyassine@gmail.com',
                    'telephone' => '0611000001',
                    'password' => 'admin12345',
                    'type' => null,
                    'last_login_at' => now()->subDay(),
                    'is_active' => true,
                ],
            ],
            [
                'role' => 'gestionnaire',
                'state' => 'gestionnaire',
                'attributes' => [
                    'nom' => 'Ait El Haj',
                    'prenom' => 'Sara',
                    'email' => 'gestionnaire@ofppt.local',
                    'telephone' => '0611000002',
                    'password' => 'Password@123',
                    'type' => null,
                    'last_login_at' => now()->subHours(6),
                    'is_active' => true,
                ],
            ],
            [
                'role' => 'formateur',
                'state' => 'formateur',
                'attributes' => [
                    'nom' => 'El Idrissi',
                    'prenom' => 'Youssef',
                    'email' => 'formateur1@ofppt.local',
                    'telephone' => '0611000003',
                    'password' => 'Password@123',
                    'type' => FormateurTypeEnum::Permanent,
                    'last_login_at' => now()->subHours(4),
                    'is_active' => true,
                ],
            ],
            [
                'role' => 'formateur',
                'state' => 'formateur',
                'attributes' => [
                    'nom' => 'Chraibi',
                    'prenom' => 'Meryem',
                    'email' => 'formateur2@ofppt.local',
                    'telephone' => '0611000004',
                    'password' => 'Password@123',
                    'type' => FormateurTypeEnum::Vacataire,
                    'last_login_at' => now()->subHours(2),
                    'is_active' => true,
                ],
            ],
            [
                'role' => 'formateur',
                'state' => 'formateur',
                'attributes' => [
                    'nom' => 'Tazi',
                    'prenom' => 'Nabil',
                    'email' => 'formateur3@ofppt.local',
                    'telephone' => '0611000005',
                    'password' => 'Password@123',
                    'type' => FormateurTypeEnum::Permanent,
                    'last_login_at' => now()->subHours(8),
                    'is_active' => true,
                ],
            ],
        ];

        foreach ($users as $definition) {
            /** @var User $user */
            $user = User::query()->updateOrCreate(
                ['email' => $definition['attributes']['email']],
                $definition['attributes'],
            );

            $user->syncRoles([$definition['role']]);
        }
    }
}
