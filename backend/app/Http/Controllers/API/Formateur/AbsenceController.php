<?php

namespace App\Http\Controllers\API\Formateur;

use App\Http\Controllers\Controller;
use App\Http\Resources\AbsenceResource;
use Illuminate\Http\Request;

class AbsenceController extends Controller
{
    /**
     * Liste des absences du formateur.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Récupérer absences des groupes du formateur
        $query = $user->absences()
            ->with([
                'stagiaire',
                'groupe',
                'groupe.filiere',
                'autorisation',
            ])
            ->orderByDesc('date_absence');

        // Filtre groupe
        if ($request->groupe_id) {

            $query->where('groupe_id', (int) $request->groupe_id);
        }

        // Filtre stagiaire
        if ($request->stagiaire_id) {

            $query->where('stagiaire_id', (int) $request->stagiaire_id);
        }

        // Filtre date
        if ($request->date_absence) {

            $query->whereDate('date_absence', $request->date_absence);
        }

        // Filtre type
        if ($request->type) {

            $query->where('type', $request->type);
        }

        // Pagination
        $absences = $query->paginate($this->perPage($request));

        return $this->paginatedResponse(
            AbsenceResource::collection($absences),
            'Liste des absences',
        );
    }

    /**
     * Détails d’une absence.
     */
    public function show($id)
    {
        $user = auth()->user();

        // Chercher seulement dans les absences du formateur
        $absence = $user->absences()
            ->with([
                'stagiaire',
                'stagiaire.groupe',
                'groupe.filiere',
                'autorisation',
            ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Détails de l absence',
            'data' => new AbsenceResource($absence),
        ]);
    }
}
