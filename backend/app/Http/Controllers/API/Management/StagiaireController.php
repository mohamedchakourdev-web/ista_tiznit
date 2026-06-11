<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreStagiaireRequest;
use App\Http\Requests\Management\UpdateStagiaireRequest;
use App\Http\Resources\StagiaireResource;
use App\Imports\StagiairesImport;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

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
        $absolutePath = Storage::disk($importDisk)->path($path);
        $import = new StagiairesImport;

        try {
            Excel::import($import, $absolutePath);
        } catch (Throwable $exception) {
            Log::error('Import stagiaires - echec du traitement.', [
                'file' => $path,
                'disk' => $importDisk,
                'message' => $exception->getMessage(),
            ]);

            $import->addGlobalError('Le fichier n\'a pas pu etre traite. Verifiez son format et son contenu.');

            return $this->importResponse(
                $import,
                'Import echoue',
                false,
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        } finally {
            Storage::disk($importDisk)->delete($path);
        }

        $report = $import->report();

        if ($report['imported'] > 0 && $report['failed'] === 0) {
            return $this->importResponse(
                $import,
                'Import termine avec succes',
                true,
            );
        }

        if ($report['imported'] > 0) {
            return $this->importResponse(
                $import,
                'Import termine avec avertissements',
                true,
                Response::HTTP_OK,
            );
        }

        if ($report['failed'] === 0) {
            $import->addGlobalError('Aucune ligne valide a importer n\'a ete trouvee dans le fichier.');
        }

        return $this->importResponse(
            $import,
            'Import echoue',
            false,
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
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

        // Enregistrer qui supprime puis soft-delete (avec cascade sur les
        // absences et autorisations) dans une seule transaction.
        DB::transaction(static function () use ($stagiaire, $user): void {
            $stagiaire->deleted_by = $user->id;
            $stagiaire->save();

            $stagiaire->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Stagiaire supprimé',
        ]);
    }

    private function importResponse(
        StagiairesImport $import,
        string $message,
        bool $success,
        int $status = Response::HTTP_OK,
    ): JsonResponse {
        $report = $import->report();

        $payload = [
            'success' => $success,
            'message' => $message,
            'imported' => $report['imported'],
            'failed' => $report['failed'],
            'errors' => $report['errors'],
            'data' => [
                'imported' => $report['imported'],
                'failed' => $report['failed'],
                'errors' => $report['errors'],
            ],
        ];

        return response()->json($payload, $status);
    }
}
