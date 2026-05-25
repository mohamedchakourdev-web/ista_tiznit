<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Director;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Liste des utilisateurs.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $query = User::with(['roles', 'permissions'])
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

        $users = $query->paginate($this->perPage($request));

        return $this->paginatedResponse(
            UserResource::collection($users),
            'Liste des utilisateurs',
        );
    }

    /**
     * Détails d'un utilisateur.
     */
    public function show(int $userId): JsonResponse
    {
        $user = auth()->user();

        $targetUser = User::with(['roles', 'permissions', 'groupes.filiere'])
            ->findOrFail($userId);

        return response()->json([
            'success' => true,
            'message' => 'Détails de l utilisateur',
            'data' => new UserResource($targetUser),
        ]);
    }
}
