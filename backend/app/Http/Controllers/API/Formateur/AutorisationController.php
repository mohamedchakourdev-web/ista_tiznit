<?php

namespace App\Http\Controllers\API\Formateur;

use App\Http\Controllers\Controller;
use App\Http\Requests\Formateur\UpdateAutorisationStatusRequest;
use App\Http\Resources\AutorisationResource;
use App\Models\Autorisation;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class AutorisationController extends Controller
{
    /**
     * Liste des autorisations du formateur.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Le formateur voit seulement ses autorisations
        $query = Autorisation::where('target_user_id', $user->id)
            ->with([
                'absence.stagiaire',
                'absence.groupe',
                'absences.groupe',
                'stagiaire.groupe',
            ])
            ->orderBy('created_at', 'desc');

        // Filtre statut
        if ($request->statut) {
            $query->where('statut', $request->statut);
        }

        // Filtre lecture
        if ($request->is_read !== null) {
            $query->where('is_read', $request->is_read);
        }

        $term = trim((string) $request->search);

        if ($term !== '') {
            $search = '%'.$term.'%';

            $query->where(function ($q) use ($search) {
                $q->whereHas('stagiaire', function ($stagiaireQuery) use ($search) {
                    $stagiaireQuery->where('nom', 'like', $search)
                        ->orWhere('prenom', 'like', $search)
                        ->orWhere('cef', 'like', $search);
                })->orWhereHas('absence.stagiaire', function ($stagiaireQuery) use ($search) {
                    $stagiaireQuery->where('nom', 'like', $search)
                        ->orWhere('prenom', 'like', $search)
                        ->orWhere('cef', 'like', $search);
                });
            });
        }

        $autorisations = $query->paginate($this->perPage($request));

        return $this->paginatedResponse(
            AutorisationResource::collection($autorisations),
            'Liste des autorisations',
        );
    }

    /**
     * Afficher une autorisation.
     */
    public function show($id)
    {
        $user = auth()->user();

        // Le formateur peut voir seulement ses autorisations
        $autorisation = Autorisation::where('target_user_id', $user->id)
            ->with([
                'absence.stagiaire',
                'absence.groupe',
                'absences.groupe',
                'stagiaire.groupe',
            ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Details de l autorisation',
            'data' => new AutorisationResource($autorisation),
        ]);
    }

    /**
     * Accepter ou refuser une autorisation.
     */
    public function updateStatus(
        UpdateAutorisationStatusRequest $request,
        $id
    ) {
        $user = auth()->user();

        // Chercher autorisation
        $autorisation = Autorisation::where('target_user_id', $user->id)
            ->findOrFail($id);

        // Modifier statut
        $autorisation->update([
            'statut' => $request->statut,
            'validated_by' => $user->id,
            'date_validation' => now(),
            'is_read' => true,
            'read_at' => now(),
        ]);

        // Notification pour gestionnaire/directeur
        $users = User::role(['gestionnaire', 'directeur'])->get();

        foreach ($users as $recipient) {
            Notification::create([
                'user_id' => $recipient->id,
                'autorisation_id' => $autorisation->id,
                'title' => 'Mise a jour autorisation',
                'message' => 'Le formateur a repondu a une autorisation.',
                'type' => 'autorisation',
                'is_read' => false,
            ]);
        }

        $autorisation->load([
            'absence.stagiaire',
            'absence.groupe',
            'absences.groupe',
            'stagiaire.groupe',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Autorisation mise a jour avec succes',
            'data' => new AutorisationResource($autorisation),
        ]);
    }
}
