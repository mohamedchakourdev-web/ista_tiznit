<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Connexion de l'utilisateur.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $email = (string) $data['email'];
        $password = (string) $data['password'];

        $user = User::where('email', $email)->first();

        if ($user === null) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est inactif.',
            ], 403);
        }

        $deviceName = '';

        if (! empty($data['device_name'])) {
            $deviceName = trim((string) $data['device_name']);
        }

        if ($deviceName === '') {
            $deviceName = trim((string) $request->userAgent());
        }

        if ($deviceName === '') {
            $deviceName = 'api-client';
        }

        if ($user->hasRole('directeur')) {
            $abilities = ['*'];
        } else {
            $abilities = $user->getAllPermissions()->pluck('name')->all();
        }

        $token = $user->createToken(mb_substr($deviceName, 0, 120), $abilities)->plainTextToken;

        $user->last_login_at = now();
        $user->save();
        $user->load(['roles', 'permissions', 'groupes.filiere']);

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'token' => $token,
                'user' => new UserResource($user),
            ],
        ]);
    }

    /**
     * Déconnexion (supprime le token courant).
     */
    public function logout(): JsonResponse
    {
        $user = auth()->user();

        $token = $user->currentAccessToken();

        if ($token !== null) {
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout successful.',
            'data' => (object) [],
        ]);
    }

    /**
     * Récupère l'utilisateur authentifié.
     */
    public function me(): JsonResponse
    {
        $user = auth()->user();

        if (! $user->can('view dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n avez pas la permission de consulter votre profil.',
            ], 403);
        }

        $user->load(['roles', 'permissions', 'groupes.filiere']);

        return response()->json([
            'success' => true,
            'message' => 'Authenticated user retrieved successfully.',
            'data' => new UserResource($user),
        ]);
    }
}
