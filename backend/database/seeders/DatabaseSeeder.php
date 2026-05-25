<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Seeds the application in the correct dependency order.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            AdminSeeder::class,
            FiliereSeeder::class,
            DiplomeTypeSeeder::class,
            GroupeSeeder::class,
            StagiaireSeeder::class,
            AbsenceSeeder::class,
        ]);
    }
}
