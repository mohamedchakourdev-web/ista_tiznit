<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Director;

use App\Http\Controllers\Controller;
use App\Http\Requests\Director\StoreUserRequest;
use App\Http\Requests\Director\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

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

    /**
     * Creer un utilisateur.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();
        $role = (string) $data['role'];
        unset($data['role']);

        $data['prenom'] = $data['prenom'] ?? '';
        $data['is_active'] = true;

        $targetUser = User::create($data);
        $targetUser->syncRoles([$role]);
        $targetUser->load(['roles', 'permissions']);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur cree',
            'data' => new UserResource($targetUser),
        ], Response::HTTP_CREATED);
    }

    /**
     * Mettre a jour un utilisateur.
     */
    public function update(UpdateUserRequest $request, int $userId): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();
        $role = $data['role'] ?? null;
        unset($data['role']);

        if (array_key_exists('prenom', $data) && $data['prenom'] === null) {
            $data['prenom'] = '';
        }

        $targetUser = User::findOrFail($userId);
        $targetUser->update($data);

        if ($role !== null) {
            $targetUser->syncRoles([(string) $role]);
        }

        $targetUser->refresh();
        $targetUser->load(['roles', 'permissions']);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur mis a jour',
            'data' => new UserResource($targetUser),
        ]);
    }

    /**
     * Supprimer un utilisateur.
     */
    public function destroy(int $userId): JsonResponse
    {
        $user = auth()->user();

        if ($user !== null && (int) $user->id === $userId) {
            return $this->errorResponse(
                'Vous ne pouvez pas supprimer votre propre compte.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $targetUser = User::findOrFail($userId);
        $targetUser->tokens()->delete();
        $targetUser->delete();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprime',
            'data' => (object) [],
        ]);
    }
}
