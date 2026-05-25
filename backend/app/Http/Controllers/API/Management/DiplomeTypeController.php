<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Management;

use App\Http\Controllers\Controller;
use App\Http\Resources\DiplomeTypeResource;
use App\Models\DiplomeType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiplomeTypeController extends Controller
{
    /**
     * Liste des types de diplome disponibles pour les stagiaires.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DiplomeType::query()
            ->orderBy('nom');

        if ($request->search) {
            $search = '%'.trim((string) $request->search).'%';

            $query->where(function ($q) use ($search): void {
                $q->where('nom', 'like', $search)
                    ->orWhere('code', 'like', $search);
            });
        }

        $diplomeTypes = $query->paginate($this->perPage($request, 100));

        return $this->paginatedResponse(
            DiplomeTypeResource::collection($diplomeTypes),
            'Liste des types de diplome',
        );
    }
}
