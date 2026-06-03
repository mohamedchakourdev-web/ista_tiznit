<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Mail\TemporaryPasswordMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
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

    /**
     * Réinitialisation de mot de passe simple (génère un mot de passe temporaire).
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.required' => 'L\'adresse email est requise.',
            'email.email' => 'L\'adresse email doit être valide.',
            'email.exists' => 'Aucun utilisateur n\'est enregistré avec cette adresse email.',
        ]);

        $user = User::where('email', $request->email)->firstOrFail();
        $previousPassword = $user->password;

        // Génère un mot de passe aléatoire de 10 caractères lisibles
        $tempPassword = Str::random(10);

        // Met à jour le mot de passe dans la base de données
        $user->password = Hash::make($tempPassword);
        $user->save();

        try {
            // Envoie l'email
            Mail::to($user->email)->send(new TemporaryPasswordMail($user, $tempPassword));
        } catch (\Throwable $exception) {
            User::query()->whereKey($user->id)->update([
                'password' => $previousPassword,
            ]);

            \Illuminate\Support\Facades\Log::error('Erreur SMTP lors de l\'envoi du mot de passe temporaire.', [
                'user_id' => $user->id,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'envoyer l\'email pour le moment. Veuillez réessayer plus tard.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Un nouveau mot de passe temporaire a été envoyé à votre adresse email.',
        ]);
    }
}
