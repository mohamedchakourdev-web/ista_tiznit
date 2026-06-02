<?php

namespace App\Http\Controllers\API\Notification;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Models\User;
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
            'autorisation.absences.groupe',
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

        $this->markLinkedAutorisationAsRead($notification, $user);
        $notification->load($this->notificationRelations());

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

    /**
     * Marquer l'autorisation liee comme lue lorsque son destinataire ouvre la notification.
     */
    private function markLinkedAutorisationAsRead(Notification $notification, User $user): void
    {
        $autorisation = $notification->autorisation;

        if ($autorisation === null || $autorisation->target_user_id !== $user->id) {
            return;
        }

        if ($autorisation->is_read && $autorisation->read_by !== null) {
            return;
        }

        $values = [
            'is_read' => true,
            'read_by' => $user->id,
        ];

        if (! $autorisation->is_read || $autorisation->read_at === null) {
            $values['read_at'] = now();
        }

        $autorisation->update($values);
    }
}
