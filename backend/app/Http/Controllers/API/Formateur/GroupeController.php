<?php

namespace App\Http\Controllers\API\Formateur;

use App\Http\Controllers\Controller;
use App\Http\Resources\GroupeResource;
use App\Models\Groupe;
use Illuminate\Http\Request;

class GroupeController extends Controller
{
    /**
     * Liste des groupes du formateur.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Formateur voit seulement ses groupes
        if ($user->hasRole('formateur')) {

            $query = $user->groupes()
                ->with('filiere')
                ->withCount(['stagiaires', 'absences'])
                ->orderBy('nom');

        } else {

            // Directeur ou gestionnaire voient tous les groupes
            $query = Groupe::with('filiere')
                ->withCount(['stagiaires', 'absences'])
                ->orderBy('nom');
        }

        // Filtre par filière
        if ($request->filiere_id) {

            $query->where('filiere_id', (int) $request->filiere_id);
        }

        // Filtre par niveau
        if ($request->niveau) {

            $query->where('niveau', $request->niveau);
        }

        // Recherche
        if ($request->search) {

            $search = '%' . $request->search . '%';

            $query->where(function ($q) use ($search) {

                $q->where('nom', 'like', $search)
                  ->orWhere('code', 'like', $search);
            });
        }

        // Pagination
        $groupes = $query->paginate($this->perPage($request));

        return $this->paginatedResponse(
            GroupeResource::collection($groupes),
            'Liste des groupes',
        );
    }

    /**
     * Afficher un seul groupe.
     */
    public function show($id)
    {
        $user = auth()->user();

        // Formateur voit seulement ses groupes
        if ($user->hasRole('formateur')) {

            $groupe = $user->groupes()
                ->with([
                    'filiere',
                    'stagiaires',
                    'formateurs',
                ])
                ->withCount([
                    'stagiaires',
                    'absences',
                ])
                ->findOrFail($id);

        } else {

            // Directeur ou gestionnaire
            $groupe = Groupe::with([
                    'filiere',
                    'stagiaires',
                    'formateurs',
                ])
                ->withCount([
                    'stagiaires',
                    'absences',
                ])
                ->findOrFail($id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Détails du groupe',
            'data' => GroupeResource::make($groupe),
        ]);
    }
}
