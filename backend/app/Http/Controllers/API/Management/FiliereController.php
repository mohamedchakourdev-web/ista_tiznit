<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreFiliereRequest;
use App\Http\Requests\Management\UpdateFiliereRequest;
use App\Http\Resources\FiliereResource;
use App\Models\Filiere;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FiliereController extends Controller
{
    /**
     * Liste des filières.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $filieres = Filiere::withCount('groupes')
            ->when($request->search, function ($query) use ($request): void {
                $search = '%'.trim((string) $request->search).'%';

                $query->where(function ($q) use ($search): void {
                    $q->where('nom', 'like', $search)
                        ->orWhere('code', 'like', $search);
                });
            })
            ->orderBy('nom')
            ->paginate($this->perPage($request));

        return $this->paginatedResponse(
            FiliereResource::collection($filieres),
            'Liste des filieres',
        );
    }

    /**
     * Détails d'une filière.
     */
    public function show(Request $request, int $filiereId): JsonResponse
    {
        $user = auth()->user();

        $filiere = Filiere::withCount('groupes')
            ->with(['groupes.filiere', 'groupes.formateurs'])
            ->findOrFail($filiereId);

        return response()->json([
            'success' => true,
            'message' => 'Détails de la filiere',
            'data' => new FiliereResource($filiere),
        ]);
    }

    /**
     * Créer une filière.
     */
    public function store(StoreFiliereRequest $request): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();

        $filiere = Filiere::create($data);
        $filiere->loadCount('groupes');

        return response()->json([
            'success' => true,
            'message' => 'Filiere creee',
            'data' => new FiliereResource($filiere),
        ], 201);
    }

    /**
     * Mettre à jour une filière.
     */
    public function update(UpdateFiliereRequest $request, int $filiereId): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();

        $filiere = Filiere::findOrFail($filiereId);
        $filiere->update($data);
        $filiere->refresh();
        $filiere->loadCount('groupes');

        return response()->json([
            'success' => true,
            'message' => 'Filiere mise a jour',
            'data' => new FiliereResource($filiere),
        ]);
    }
}
