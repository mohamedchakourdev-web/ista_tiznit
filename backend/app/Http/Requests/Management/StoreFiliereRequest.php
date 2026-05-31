<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

/**
 * Validates filiere creation requests.
 */
class StoreFiliereRequest extends ApiRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('gestionnaire') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50', Rule::unique('filieres', 'code')],
            'description' => ['nullable', 'string'],
        ];
    }
}
