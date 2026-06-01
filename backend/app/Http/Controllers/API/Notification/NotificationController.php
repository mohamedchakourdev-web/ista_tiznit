<?php

namespace App\Http\Controllers\API\Notification;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Relations a charger pour le panneau notifications.
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
     * Liste des notifications.
     */
    public function index(): JsonResponse
    {
        $user = auth()->user();

        $notifications = $user->notifications()
            ->with($this->notificationRelations())
            ->latest()
            ->paginate($this->perPage(request()));

        return $this->paginatedResponse(
            NotificationResource::collection($notifications),
            'Liste des notifications',
        );
    }

    /**
     * Liste des notifications non lues.
     */
    public function unread(): JsonResponse
    {
        $user = auth()->user();

        $notifications = $user->notifications()
            ->with($this->notificationRelations())
            ->where('is_read', false)
            ->latest()
            ->paginate($this->perPage(request()));

        return $this->paginatedResponse(
            NotificationResource::collection($notifications),
            'Liste des notifications non lues',
        );
    }

    /**
     * Details d'une notification.
     */
    public function show(int $id): JsonResponse
    {
        $user = auth()->user();

        $notification = $user->notifications()
            ->with($this->notificationRelations())
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Details de la notification',
            'data' => new NotificationResource($notification),
        ]);
    }

    /**
     * Marquer une notification comme lue.
     */
    public function markAsRead(int $id): JsonResponse
    {
        $user = auth()->user();

        $notification = $user->notifications()
            ->with($this->notificationRelations())
            ->findOrFail($id);

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

    /**
     * Marquer toutes les notifications comme lues.
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = auth()->user();

        $user->notifications()
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications sont marquees comme lues',
            'data' => (object) [],
        ]);
    }
}
