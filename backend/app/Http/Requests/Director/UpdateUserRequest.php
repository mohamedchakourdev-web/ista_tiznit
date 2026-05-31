<?php

declare(strict_types=1);

namespace App\Http\Requests\Director;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

/**
 * Validates user update requests.
 */
class UpdateUserRequest extends ApiRequest
{
    /**
     * @var list<string>
     */
    private const ALLOWED_ROLES = ['directeur', 'gestionnaire', 'formateur'];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('directeur') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = (int) $this->route('id');

        return [
            'nom' => ['sometimes', 'required', 'string', 'max:100'],
            'prenom' => ['nullable', 'string', 'max:100'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'role' => ['sometimes', 'required', 'string', Rule::in(self::ALLOWED_ROLES)],
        ];
    }
}
