<?php

namespace App\Http\Controllers\API\Notification;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;

class NotificationController extends Controller
{
    /**
     * Liste des notifications.
     */
    public function index()
    {
        $user = auth()->user();

        $notifications = $user->notifications()
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
    public function unread()
    {
        $user = auth()->user();

        $notifications = $user->notifications()
            ->where('is_read', false)
            ->latest()
            ->paginate($this->perPage(request()));

        return $this->paginatedResponse(
            NotificationResource::collection($notifications),
            'Liste des notifications non lues',
        );
    }

    /**
     * Marquer une notification comme lue.
     */
    public function markAsRead($id)
    {
        $user = auth()->user();

        $notification = $user->notifications()->findOrFail($id);

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
    public function markAllAsRead()
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
