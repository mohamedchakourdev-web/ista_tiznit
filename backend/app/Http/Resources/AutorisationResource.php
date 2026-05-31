<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Autorisation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Autorisation
 */
class AutorisationResource extends JsonResource
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
            'absence_id' => $this->absence_id,
            'stagiaire_id' => $this->stagiaire_id,
            'target_user_id' => $this->target_user_id,
            'code' => $this->code,
            'motif' => $this->motif,
            'statut' => $this->statut->value,
            'date_validation' => $this->date_validation?->toIso8601String(),
            'is_read' => $this->is_read,
            'read_at' => $this->read_at?->toIso8601String(),
            'absence' => AbsenceResource::make($this->whenLoaded('absence')),
            'stagiaire' => StagiaireResource::make($this->whenLoaded('stagiaire')),
            'target_user' => UserResource::make($this->whenLoaded('targetUser')),
            'validated_by_user' => UserResource::make($this->whenLoaded('validatedByUser')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
