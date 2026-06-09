<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreGroupeRequest;
use App\Http\Requests\Management\UpdateGroupeRequest;
use App\Http\Resources\GroupeResource;
use App\Http\Resources\UserResource;
use App\Models\Groupe;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class GroupeController extends Controller
{
    /**
     * Liste des groupes.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $query = Groupe::with(['filiere', 'formateurs'])
            ->withCount(['stagiaires', 'absences'])
            ->orderBy('nom');

        if ($request->filiere_id) {
            $query->where('filiere_id', (int) $request->filiere_id);
        }

        if ($request->niveau) {
            $query->where('niveau', (string) $request->niveau);
        }

        if ($request->search) {
            $search = '%'.trim((string) $request->search).'%';

            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', $search)
                    ->orWhere('code', 'like', $search);
            });
        }

        $groupes = $query->paginate($this->perPage($request));

        return $this->paginatedResponse(
            GroupeResource::collection($groupes),
            'Liste des groupes',
        );
    }

    /**
     * Liste des formateurs actifs disponibles pour les groupes.
     */
    public function formateurs(Request $request): JsonResponse
    {
        $query = User::role('formateur')
            ->where('is_active', true)
            ->orderBy('nom')
            ->orderBy('prenom');

        if ($request->search) {
            $search = '%'.trim((string) $request->search).'%';

            $query->where(function ($q) use ($search): void {
                $q->where('nom', 'like', $search)
                    ->orWhere('prenom', 'like', $search)
                    ->orWhere('email', 'like', $search);
            });
        }

        $formateurs = $query->paginate($this->perPage($request));

        return $this->paginatedResponse(
            UserResource::collection($formateurs),
            'Liste des formateurs',
        );
    }

    /**
     * Détails d'un groupe.
     */
    public function show(Request $request, int $groupeId): JsonResponse
    {
        $user = auth()->user();

        $groupe = Groupe::with(['filiere', 'formateurs', 'stagiaires.diplomeType'])
            ->withCount(['stagiaires', 'absences'])
            ->findOrFail($groupeId);

        return response()->json([
            'success' => true,
            'message' => 'Détails du groupe',
            'data' => new GroupeResource($groupe),
        ]);
    }

    /**
     * Créer un groupe.
     */
    public function store(StoreGroupeRequest $request): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();
        $formateurIds = [];

        if (! empty($data['formateur_ids'])) {
            foreach ($data['formateur_ids'] ?? [] as $formateurId) {
                $formateurIds[] = (int) $formateurId;
            }
        }

        unset($data['formateur_ids']);

        DB::beginTransaction();

        try {
            $groupe = Groupe::create($data);

            $this->syncFormateurs($groupe, $formateurIds);

            $groupe->load(['filiere', 'formateurs']);
            $groupe->loadCount(['stagiaires', 'absences']);

            DB::commit();
        } catch (Throwable $exception) {
            DB::rollBack();

            throw $exception;
        }

        return response()->json([
            'success' => true,
            'message' => 'Groupe cree',
            'data' => new GroupeResource($groupe),
        ], 201);
    }

    /**
     * Mettre à jour un groupe.
     */
    public function update(UpdateGroupeRequest $request, int $groupeId): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();
        $shouldSyncFormateurs = false;
        $formateurIds = [];

        if (array_key_exists('formateur_ids', $data)) {
            $shouldSyncFormateurs = true;

            foreach ($data['formateur_ids'] ?? [] as $formateurId) {
                $formateurIds[] = (int) $formateurId;
            }
        }

        unset($data['formateur_ids']);

        DB::beginTransaction();

        try {
            $groupe = Groupe::findOrFail($groupeId);
            $groupe->update($data);

            if ($shouldSyncFormateurs) {
                $this->syncFormateurs($groupe, $formateurIds);
            }

            $groupe->refresh();
            $groupe->load(['filiere', 'formateurs']);
            $groupe->loadCount(['stagiaires', 'absences']);

            DB::commit();
        } catch (Throwable $exception) {
            DB::rollBack();

            throw $exception;
        }

        return response()->json([
            'success' => true,
            'message' => 'Groupe mis a jour',
            'data' => new GroupeResource($groupe),
        ]);
    }

    /**
     * Supprimer un groupe.
     */
    public function destroy(int $groupeId): JsonResponse
    {
        $user = auth()->user();

        $groupe = Groupe::findOrFail($groupeId);

        // Soft delete the groupe and cascade to its stagiaires, absences and
        // autorisations within a single transaction.
        DB::transaction(static function () use ($groupe): void {
            $groupe->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Groupe supprime',
            'data' => (object) [],
        ]);
    }

    /**
     * Synchroniser les formateurs du groupe.
     *
     * @param  list<int>  $formateurIds
     */
    private function syncFormateurs(Groupe $groupe, array $formateurIds): void
    {
        $payload = [];

        foreach ($formateurIds as $formateurId) {
            $payload[$formateurId] = [
                'assigned_at' => now(),
            ];
        }

        $groupe->formateurs()->sync($payload);
    }
}
