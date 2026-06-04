<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreStagiaireRequest;
use App\Http\Requests\Management\UpdateStagiaireRequest;
use App\Http\Resources\StagiaireResource;
use App\Jobs\ImportStagiairesJob;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StagiaireController extends Controller
{
    /**
     * Liste des stagiaires.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $query = Stagiaire::with(['groupe.filiere', 'groupe.formateurs', 'diplomeType'])
            ->orderBy('nom')
            ->orderBy('prenom');

        if ($request->groupe_id) {
            $query->where('groupe_id', (int) $request->groupe_id);
        }

        if ($request->search) {
            $search = '%'.trim((string) $request->search).'%';

            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', $search)
                    ->orWhere('prenom', 'like', $search)
                    ->orWhere('cef', 'like', $search)
                    ->orWhere('cin', 'like', $search);
            });
        }

        $stagiaires = $query->paginate($this->perPage($request));

        return $this->paginatedResponse(
            StagiaireResource::collection($stagiaires),
            'Liste des stagiaires',
        );
    }

    /**
     * Details d'un stagiaire.
     */
    public function show(Request $request, int $stagiaireId): JsonResponse
    {
        $user = auth()->user();

        $stagiaire = Stagiaire::with(['groupe.filiere', 'groupe.formateurs', 'diplomeType'])
            ->findOrFail($stagiaireId);

        return response()->json([
            'success' => true,
            'message' => 'Details du stagiaire',
            'data' => new StagiaireResource($stagiaire),
        ]);
    }

    /**
     * Creer un stagiaire.
     */
    public function store(StoreStagiaireRequest $request): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();
        $data['created_by'] = $user->id;

        $stagiaire = Stagiaire::create($data);
        $stagiaire->load(['groupe.filiere', 'groupe.formateurs', 'diplomeType']);

        return response()->json([
            'success' => true,
            'message' => 'Stagiaire cree',
            'data' => new StagiaireResource($stagiaire),
        ], 201);
    }

    /**
     * Importer des stagiaires depuis un fichier Excel.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $importDisk = (string) config('ofppt.import_disk', 'local');
        $path = $request->file('file')->store('imports', $importDisk);

        ImportStagiairesJob::dispatch($path);

        return response()->json([
            'success' => true,
            'message' => 'Import en cours...',
            'data' => (object) [],
        ]);
    }

    /**
     * Mettre a jour un stagiaire.
     */
    public function update(UpdateStagiaireRequest $request, int $stagiaireId): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();
        $data['updated_by'] = $user->id;

        $stagiaire = Stagiaire::findOrFail($stagiaireId);
        $stagiaire->update($data);
        $stagiaire->refresh();
        $stagiaire->load(['groupe.filiere', 'groupe.formateurs', 'diplomeType']);

        return response()->json([
            'success' => true,
            'message' => 'Stagiaire mis a jour',
            'data' => new StagiaireResource($stagiaire),
        ]);
    }

    /**
     * Supprimer (soft delete) un stagiaire.
     */
    public function destroy(int $stagiaireId): JsonResponse
    {
        $user = auth()->user();

        $stagiaire = Stagiaire::findOrFail($stagiaireId);

        // Enregistrer qui supprime puis soft-delete
        $stagiaire->deleted_by = $user->id;
        $stagiaire->save();

        $stagiaire->delete();

        return response()->json([
            'success' => true,
            'message' => 'Stagiaire supprimé',
        ]);
    }
}
