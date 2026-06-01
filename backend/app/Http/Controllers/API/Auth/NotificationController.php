<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Relations a charger pour le detail d'une notification.
     *
     * @return array<int, string>
     */
    private function notificationRelations(): array
    {
        return [
            'absence.stagiaire.groupe',
            'absence.groupe',
            'autorisation.absence.stagiaire.groupe',
            'autorisation.absence.groupe',
            'autorisation.stagiaire.groupe',
            'autorisation.targetUser',
            'autorisation.validatedByUser',
        ];
    }

    /**
     * Liste des notifications de l'utilisateur.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $notifications = $user->notifications()
            ->with($this->notificationRelations())
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Liste des notifications',
            'data' => NotificationResource::collection($notifications),
        ]);
    }

    /**
     * Details d'une notification.
     */
    public function show(int $notificationId): JsonResponse
    {
        $user = auth()->user();

        $notification = $user
            ->notifications()
            ->with($this->notificationRelations())
            ->findOrFail($notificationId);

        return response()->json([
            'success' => true,
            'message' => 'Details de la notification',
            'data' => new NotificationResource($notification),
        ]);
    }

    /**
     * Marquer une notification comme lue.
     */
    public function markAsRead(int $notificationId): JsonResponse
    {
        $user = auth()->user();

        $notification = $user
            ->notifications()
            ->with($this->notificationRelations())
            ->findOrFail($notificationId);

        if (! $notification->is_read) {
            $notification->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marquee comme lue',
            'data' => new NotificationResource($notification),
        ]);
    }
}
