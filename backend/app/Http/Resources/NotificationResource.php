<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    /**
     * Transform notification to array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'absence_id' => $this->absence_id,
            'autorisation_id' => $this->autorisation_id,
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'is_read' => $this->is_read,
            'read_at' => $this->read_at?->toIso8601String(),
            'absence' => AbsenceResource::make($this->whenLoaded('absence')),
            'autorisation' => AutorisationResource::make($this->whenLoaded('autorisation')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
