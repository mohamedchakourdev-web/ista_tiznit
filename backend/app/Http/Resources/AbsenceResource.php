<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Absence;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Absence
 */
class AbsenceResource extends JsonResource
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
            'stagiaire_id' => $this->stagiaire_id,
            'groupe_id' => $this->groupe_id,
            'date_absence' => $this->date_absence->toDateString(),
            'periode' => $this->periode->value,
            'type' => $this->type->value,
            'minutes_retard' => $this->minutes_retard,
            'remarque' => $this->remarque,
            'stagiaire' => StagiaireResource::make($this->whenLoaded('stagiaire')),
            'groupe' => GroupeResource::make($this->whenLoaded('groupe')),
            'autorisation' => AutorisationResource::make($this->whenLoaded('autorisation')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
