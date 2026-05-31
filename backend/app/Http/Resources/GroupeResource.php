<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Groupe;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Groupe
 */
class GroupeResource extends JsonResource
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
            'filiere_id' => $this->filiere_id,
            'nom' => $this->nom,
            'code' => $this->code,
            'annee_formation' => $this->annee_formation,
            'niveau' => $this->niveau,
            'capacite' => $this->capacite,
            'filiere' => FiliereResource::make($this->whenLoaded('filiere')),
            'formateurs' => UserResource::collection($this->whenLoaded('formateurs')),
            'stagiaires' => StagiaireResource::collection($this->whenLoaded('stagiaires')),
            'stagiaires_count' => $this->whenCounted('stagiaires'),
            'absences_count' => $this->whenCounted('absences'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
