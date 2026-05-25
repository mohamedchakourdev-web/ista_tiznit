<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Seeds application roles and permissions.
 */
class RolePermissionSeeder extends Seeder
{
    /**
     * Guard name used for seeded roles and permissions.
     */
    private const GUARD = 'web';

    /**
     * Seed the application's roles and permissions.
     */
    public function run(): void
    {
        // Clear cached permissions to ensure fresh seeding
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'manage users',
            'manage groupes',
            'manage filieres',
            'manage stagiaires',
            'manage absences',
            'manage autorisations',
            'view dashboard',
            'receive notifications',
        ];

        // Create permissions if they don't exist
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, self::GUARD);
        }

        // Clear cache after creating permissions
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $rolePermissions = [
            'directeur' => $permissions,
            'gestionnaire' => [
                'manage groupes',
                'manage filieres',
                'manage stagiaires',
                'manage absences',
                'manage autorisations',
                'view dashboard',
                'receive notifications',
            ],
            'formateur' => [
                'manage autorisations',
                'view dashboard',
                'receive notifications',
            ],
        ];

        // Create roles and assign permissions
        foreach ($rolePermissions as $roleName => $grantedPermissions) {
            $role = Role::findOrCreate($roleName, self::GUARD);
            $role->syncPermissions($grantedPermissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
