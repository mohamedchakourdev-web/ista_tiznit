<?php

declare(strict_types=1);

use App\Http\Controllers\API\Auth\AuthController;
use App\Http\Controllers\API\Auth\ProfileController;
use App\Http\Controllers\API\Director\OverviewController;
use App\Http\Controllers\API\Director\UserController;
use App\Http\Controllers\API\Formateur\AbsenceController as FormateurAbsenceController;
use App\Http\Controllers\API\Formateur\AutorisationController as FormateurAutorisationController;
use App\Http\Controllers\API\Formateur\GroupeController as FormateurGroupeController;
use App\Http\Controllers\API\Formateur\StagiaireController as FormateurStagiaireController;
use App\Http\Controllers\API\Management\AbsenceController as ManagementAbsenceController;
use App\Http\Controllers\API\Management\AutorisationController as ManagementAutorisationController;
use App\Http\Controllers\API\Management\DiplomeTypeController;
use App\Http\Controllers\API\Management\FiliereController;
use App\Http\Controllers\API\Management\GroupeController as ManagementGroupeController;
use App\Http\Controllers\API\Management\StagiaireController as ManagementStagiaireController;
use App\Http\Controllers\API\Notification\NotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/avatar', [ProfileController::class, 'avatar']);
    Route::put('/profile/password', [ProfileController::class, 'password']);

    Route::prefix('notifications')->group(function (): void {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread', [NotificationController::class, 'unread']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead'])
            ->whereNumber('id');
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    });

    Route::prefix('director')
        ->middleware(['role:directeur'])
        ->group(function (): void {
            Route::get('/overview', [OverviewController::class, 'index']);

            Route::middleware('permission:manage users')->group(function (): void {
                Route::get('/users', [UserController::class, 'index']);
                Route::post('/users', [UserController::class, 'store']);
                Route::get('/users/{id}', [UserController::class, 'show'])
                    ->whereNumber('id');
                Route::put('/users/{id}', [UserController::class, 'update'])
                    ->whereNumber('id');
                Route::delete('/users/{id}', [UserController::class, 'destroy'])
                    ->whereNumber('id');
            });
        });

    Route::prefix('directeur')
        ->middleware(['role:directeur'])
        ->group(function (): void {
            Route::middleware('permission:manage users')->group(function (): void {
                Route::get('/users', [UserController::class, 'index']);
                Route::post('/users', [UserController::class, 'store']);
                Route::get('/users/{id}', [UserController::class, 'show'])
                    ->whereNumber('id');
                Route::put('/users/{id}', [UserController::class, 'update'])
                    ->whereNumber('id');
                Route::delete('/users/{id}', [UserController::class, 'destroy'])
                    ->whereNumber('id');
            });
        });

    Route::prefix('gestionnaire')
        ->middleware(['role:directeur|gestionnaire'])
        ->group(function (): void {
            Route::get('/formateurs', [ManagementGroupeController::class, 'formateurs'])
                ->middleware('permission:manage groupes');

            Route::prefix('filieres')
                ->middleware('permission:manage filieres')
                ->group(function (): void {
                    Route::get('/', [FiliereController::class, 'index']);
                    Route::post('/', [FiliereController::class, 'store']);
                    Route::get('/{filiereId}', [FiliereController::class, 'show'])
                        ->whereNumber('filiereId');
                    Route::put('/{filiereId}', [FiliereController::class, 'update'])
                        ->whereNumber('filiereId');
                    Route::patch('/{filiereId}', [FiliereController::class, 'update'])
                        ->whereNumber('filiereId');
                    Route::delete('/{filiereId}', [FiliereController::class, 'destroy'])
                        ->whereNumber('filiereId');
                });

            Route::prefix('groupes')
                ->middleware('permission:manage groupes')
                ->group(function (): void {
                    Route::get('/', [ManagementGroupeController::class, 'index']);
                    Route::post('/', [ManagementGroupeController::class, 'store']);
                    Route::get('/{groupeId}', [ManagementGroupeController::class, 'show'])
                        ->whereNumber('groupeId');
                    Route::patch('/{groupeId}', [ManagementGroupeController::class, 'update'])
                        ->whereNumber('groupeId');
                    Route::delete('/{groupeId}', [ManagementGroupeController::class, 'destroy'])
                        ->whereNumber('groupeId');
                });

            Route::prefix('stagiaires')
                ->middleware('permission:manage stagiaires')
                ->group(function (): void {
                    Route::get('/', [ManagementStagiaireController::class, 'index']);
                    Route::post('/', [ManagementStagiaireController::class, 'store']);
                    Route::post('/import', [ManagementStagiaireController::class, 'import']);
                    Route::get('/{stagiaireId}', [ManagementStagiaireController::class, 'show'])
                        ->whereNumber('stagiaireId');
                    Route::patch('/{stagiaireId}', [ManagementStagiaireController::class, 'update'])
                        ->whereNumber('stagiaireId');
                    Route::delete('/{stagiaireId}', [ManagementStagiaireController::class, 'destroy'])
                        ->whereNumber('stagiaireId');
                });

            Route::prefix('diplome-types')
                ->middleware('permission:manage stagiaires')
                ->group(function (): void {
                    Route::get('/', [DiplomeTypeController::class, 'index']);
                });

            Route::prefix('absences')
                ->middleware('permission:manage absences')
                ->group(function (): void {
                    Route::get('/', [ManagementAbsenceController::class, 'index']);
                    Route::post('/', [ManagementAbsenceController::class, 'store']);
                    Route::get('/{absenceId}', [ManagementAbsenceController::class, 'show'])
                        ->whereNumber('absenceId');
                    Route::patch('/{absenceId}', [ManagementAbsenceController::class, 'update'])
                        ->whereNumber('absenceId');
                });

            Route::prefix('autorisations')
                ->middleware('permission:manage autorisations')
                ->group(function (): void {
                    Route::get('/', [ManagementAutorisationController::class, 'index']);
                    Route::post('/', [ManagementAutorisationController::class, 'store']);
                    Route::get('/{autorisationId}', [ManagementAutorisationController::class, 'show'])
                        ->whereNumber('autorisationId');
                });
        });

    Route::prefix('formateur')
        ->middleware(['role:formateur'])
        ->group(function (): void {
            Route::prefix('groupes')->group(function (): void {
                Route::get('/', [FormateurGroupeController::class, 'index']);
                Route::get('/{groupeId}', [FormateurGroupeController::class, 'show'])
                    ->whereNumber('groupeId');
            });

            Route::prefix('stagiaires')->group(function (): void {
                Route::get('/', [FormateurStagiaireController::class, 'index']);
                Route::get('/{stagiaireId}', [FormateurStagiaireController::class, 'show'])
                    ->whereNumber('stagiaireId');
            });

            Route::prefix('absences')->group(function (): void {
                Route::get('/', [FormateurAbsenceController::class, 'index']);
                Route::get('/{absenceId}', [FormateurAbsenceController::class, 'show'])
                    ->whereNumber('absenceId');
            });

            Route::prefix('autorisations')
                ->middleware('permission:manage autorisations')
                ->group(function (): void {
                    Route::get('/', [FormateurAutorisationController::class, 'index']);
                    Route::get('/{autorisationId}', [FormateurAutorisationController::class, 'show'])
                        ->whereNumber('autorisationId');
                    Route::patch('/{autorisationId}/status', [FormateurAutorisationController::class, 'updateStatus'])
                        ->whereNumber('autorisationId');
                });
        });
});
