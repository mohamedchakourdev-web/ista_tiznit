<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protects the mail transport test endpoint with a shared secret.
 */
class ValidateMailTestToken
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $expected = (string) config('services.brevo.mail_test_token', '');
        $provided = (string) $request->header('X-Mail-Test-Token', '');

        if ($expected === '' || ! hash_equals($expected, $provided)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
                'errors' => (object) [],
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}
