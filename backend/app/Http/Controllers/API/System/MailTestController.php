<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\System;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Sends a real email through the configured Laravel mail transport (Brevo API).
 */
class MailTestController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $recipient = (string) $data['email'];

        try {
            Mail::html(
                '<p>Test d envoi reussi via l API Brevo (HTTPS).</p>',
                static function ($message) use ($recipient): void {
                    $message->to($recipient)
                        ->subject('OFPPT — Test envoi Brevo API');
                },
            );
        } catch (Throwable $exception) {
            Log::error('Echec du test d envoi Brevo API.', [
                'email' => $recipient,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Impossible d envoyer l email de test.',
                'errors' => (object) [],
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email de test envoye avec succes via Brevo API.',
            'data' => [
                'email' => $recipient,
                'transport' => (string) config('mail.default'),
            ],
        ]);
    }
}
