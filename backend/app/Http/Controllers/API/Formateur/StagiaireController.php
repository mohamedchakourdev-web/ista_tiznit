<?php

namespace App\Http\Controllers\API\Formateur;

use App\Http\Controllers\Controller;
use App\Http\Resources\StagiaireResource;
use Illuminate\Http\Request;

class StagiaireController extends Controller
{
    /**
     * Liste des stagiaires du formateur.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Récupérer stagiaires des groupes du formateur
        $query = $user->stagiaires()
            ->with([
                'groupe',
                'groupe.filiere',
                'diplomeType',
            ])
            ->orderBy('nom')
            ->orderBy('prenom');

        // Filtre groupe
        if ($request->groupe_id) {

            $query->where('groupe_id', (int) $request->groupe_id);
        }

        // Recherche
        if ($request->search) {

            $search = '%' . $request->search . '%';

            $query->where(function ($q) use ($search) {

                $q->where('nom', 'like', $search)
                  ->orWhere('prenom', 'like', $search)
                  ->orWhere('cef', 'like', $search)
                  ->orWhere('cin', 'like', $search);
            });
        }

        // Pagination
        $stagiaires = $query->paginate($this->perPage($request));

        return $this->paginatedResponse(
            StagiaireResource::collection($stagiaires),
            'Liste des stagiaires',
        );
    }

    /**
     * Détails d’un stagiaire.
     */
    public function show($id)
    {
        $user = auth()->user();

        // Chercher seulement dans les stagiaires du formateur
        $stagiaire = $user->stagiaires()
            ->with([
                'groupe',
                'groupe.filiere',
                'diplomeType',
                'absences',
            ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Détails du stagiaire',
            'data' => new StagiaireResource($stagiaire),
        ]);
    }
}
