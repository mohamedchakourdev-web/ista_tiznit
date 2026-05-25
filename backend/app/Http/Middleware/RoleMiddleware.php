<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforces role-based access to API endpoints.
 */
class RoleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            throw new AuthenticationException('Unauthenticated.');
        }

        if ($user->hasRole('directeur')) {
            return $next($request);
        }

        $allowedRoles = $this->parseArguments($roles);

        if (! $user->hasAnyRole($allowedRoles)) {
            throw new AuthorizationException('Vous n avez pas le role requis pour acceder a cette ressource.');
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
