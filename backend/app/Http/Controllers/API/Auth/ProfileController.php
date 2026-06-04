<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateAvatarRequest;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Recuperer le profil de l'utilisateur authentifie.
     */
    public function show(): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();
        $user->load(['roles', 'permissions', 'groupes.filiere']);

        return $this->profileResponse($user, 'Profil recupere avec succes.');
    }

    /**
     * Mettre a jour les informations modifiables du profil.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->update($request->validated());
        $user->refresh();
        $user->load(['roles', 'permissions', 'groupes.filiere']);

        return $this->profileResponse($user, 'Profil mis a jour avec succes.');
    }

    /**
     * Remplacer la photo de profil.
     */
    public function avatar(UpdateAvatarRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $file = $request->file('avatar');

        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'avatar' => ['Veuillez choisir une image.'],
            ]);
        }

        $previousAvatar = $user->avatar;
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        $filename = sprintf('user-%d-%s.%s', $user->id, Str::uuid()->toString(), $extension);
        $avatarDisk = (string) config('ofppt.avatar_disk', 'public');
        $path = $file->storeAs('avatars', $filename, $avatarDisk);

        if (! is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'avatar' => ['Impossible d enregistrer l image.'],
            ]);
        }

        $user->avatar = $path;
        $user->save();

        $this->deleteStoredAvatar($previousAvatar);

        $user->refresh();
        $user->load(['roles', 'permissions', 'groupes.filiere']);

        return $this->profileResponse($user, 'Avatar mis a jour avec succes.');
    }

    /**
     * Changer le mot de passe de l'utilisateur authentifie.
     *
     * @throws ValidationException
     */
    public function password(UpdatePasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        if (! Hash::check((string) $data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->password = Hash::make((string) $data['new_password']);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe mis a jour avec succes.',
            'data' => (object) [],
        ]);
    }

    private function profileResponse(User $user, string $message): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => new UserResource($user),
        ]);
    }

    private function deleteStoredAvatar(?string $avatar): void
    {
        if ($avatar === null || $avatar === '') {
            return;
        }

        if (Str::startsWith($avatar, ['http://', 'https://', '/', 'data:'])) {
            return;
        }

        $avatarDisk = (string) config('ofppt.avatar_disk', 'public');

        if (Storage::disk($avatarDisk)->exists($avatar)) {
            Storage::disk($avatarDisk)->delete($avatar);
        }
    }
}
