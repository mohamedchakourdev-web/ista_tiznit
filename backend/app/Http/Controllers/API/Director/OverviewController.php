<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Director;

use App\Http\Resources\AbsenceResource;
use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Autorisation;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class OverviewController extends Controller
{
    /**
     * Tableau de bord directeur — statistiques et dernières absences.
     */
    public function index(): JsonResponse
    {
        $user = auth()->user();

        $usersCount = User::count();
        $activeUsersCount = User::where('is_active', true)->count();
        $filieresCount = Filiere::count();
        $groupesCount = Groupe::count();
        $stagiairesCount = Stagiaire::count();
        $absencesCount = Absence::count();
        $autorisationsEnAttenteCount = Autorisation::where('statut', 'en_attente')->count();

        $latestAbsences = Absence::with(['stagiaire', 'groupe'])
            ->orderByDesc('date_absence')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Aperçu du directeur',
            'data' => [
                'statistics' => [
                    'users_count' => $usersCount,
                    'active_users_count' => $activeUsersCount,
                    'filieres_count' => $filieresCount,
                    'groupes_count' => $groupesCount,
                    'stagiaires_count' => $stagiairesCount,
                    'absences_count' => $absencesCount,
                    'autorisations_en_attente_count' => $autorisationsEnAttenteCount,
                ],
                'latest_absences' => AbsenceResource::collection($latestAbsences),
            ],
        ]);
    }
}
