<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforces permission-based access to API endpoints.
 */
class PermissionMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permissions): Response
    {
        $user = $request->user();

        if ($user === null) {
            throw new AuthenticationException('Unauthenticated.');
        }

        if ($user->hasRole('directeur')) {
            return $next($request);
        }

        $allowedPermissions = $this->parseArguments($permissions);

        if (! $user->hasAnyPermission($allowedPermissions)) {
            throw new AuthorizationException('Vous n avez pas la permission requise pour acceder a cette ressource.');
        }

        return $next($request);
    }

    /**
     * Parse the route middleware arguments.
     *
     * @return list<string>
     */
    private function parseArguments(string $arguments): array
    {
        return array_values(array_filter(preg_split('/[|,]/', $arguments) ?: []));
    }
}
