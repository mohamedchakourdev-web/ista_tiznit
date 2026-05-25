<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

abstract class Controller
{
    protected function successResponse(
        mixed $data = null,
        string $message = 'Success',
        int $status = Response::HTTP_OK,
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data ?? (object) [],
        ], $status);
    }

    protected function errorResponse(
        string $message = 'Operation failed',
        array $errors = [],
        int $status = Response::HTTP_BAD_REQUEST,
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors === [] ? (object) [] : $errors,
        ], $status);
    }

    protected function perPage(Request $request, int $default = 15): int
    {
        $perPage = $request->integer('per_page', $default);

        return max(1, min($perPage, 100));
    }

    protected function paginatedResponse(
        AnonymousResourceCollection $collection,
        string $message = 'Success',
        int $status = Response::HTTP_OK,
    ): JsonResponse {
        $payload = $collection->response()->getData(true);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $payload['data'] ?? [],
            'links' => $payload['links'] ?? (object) [],
            'meta' => $payload['meta'] ?? (object) [],
        ], $status);
    }
}
