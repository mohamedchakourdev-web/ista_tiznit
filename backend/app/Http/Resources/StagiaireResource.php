<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Stagiaire;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Stagiaire
 */
class StagiaireResource extends JsonResource
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
            'groupe_id' => $this->groupe_id,
            'diplome_type_id' => $this->diplome_type_id,
            'cef' => $this->cef,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'cin' => $this->cin,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'date_naissance' => $this->date_naissance?->toDateString(),
            'adresse' => $this->adresse,
            'ville' => $this->ville,
            'photo' => $this->photo,
            'sexe' => $this->sexe->value,
            'groupe' => GroupeResource::make($this->whenLoaded('groupe')),
            'diplome_type' => DiplomeTypeResource::make($this->whenLoaded('diplomeType')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
