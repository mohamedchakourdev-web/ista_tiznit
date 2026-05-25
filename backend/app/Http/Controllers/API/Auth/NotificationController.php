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
     * Liste des notifications de l'utilisateur.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $notifications = $user->notifications()
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Liste des notifications',
            'data' => NotificationResource::collection($notifications),
        ]);
    }

    /**
     * Détails d'une notification.
     */
    public function show(int $notificationId): JsonResponse
    {
        $user = auth()->user();

        $notification = $user
            ->notifications()
            ->findOrFail($notificationId);

        return response()->json([
            'success' => true,
            'message' => 'Détails de la notification',
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
            ->findOrFail($notificationId);

        if (! $notification->is_read) {
            $notification->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue',
            'data' => new NotificationResource($notification),
        ]);
    }
}
