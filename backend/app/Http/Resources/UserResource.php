<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'avatar' => $this->avatarUrl(),
            'type' => $this->type?->value,
            'is_active' => $this->is_active,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'roles' => $this->when(
                $this->relationLoaded('roles'),
                fn (): array => $this->roles->pluck('name')->values()->all(),
            ),
            'permissions' => $this->when(
                $this->relationLoaded('permissions'),
                fn (): array => $this->getAllPermissions()->pluck('name')->values()->all(),
            ),
            'groupes' => GroupeResource::collection($this->whenLoaded('groupes')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    private function avatarUrl(): ?string
    {
        if ($this->avatar === null || $this->avatar === '') {
            return null;
        }

        if (Str::startsWith($this->avatar, ['http://', 'https://', 'data:'])) {
            return $this->avatar;
        }

        if (Str::startsWith($this->avatar, '/')) {
            return $this->avatar;
        }

        return '/storage/'.$this->avatar;
    }
}
