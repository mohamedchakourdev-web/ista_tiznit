<?php

declare(strict_types=1);

namespace App\Http\Requests\Director;

use App\Http\Requests\ApiRequest;
use App\Enums\FormateurTypeEnum;
use Illuminate\Validation\Rule;

/**
 * Validates user creation requests.
 */
class StoreUserRequest extends ApiRequest
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
        $types = array_map(fn (FormateurTypeEnum $t) => $t->value, FormateurTypeEnum::cases());

        return [
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['nullable', 'string', 'max:100'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            'telephone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in(self::ALLOWED_ROLES)],
            'type' => ['required_if:role,formateur', 'nullable', Rule::in($types)],
        ];
    }
}
