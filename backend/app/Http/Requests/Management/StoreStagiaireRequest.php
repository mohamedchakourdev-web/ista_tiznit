<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Enums\SexeEnum;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

/**
 * Validates trainee creation requests.
 */
class StoreStagiaireRequest extends ApiRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['directeur', 'gestionnaire']) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'groupe_id' => ['required', 'integer', Rule::exists('groupes', 'id')],
            'diplome_type_id' => ['required', 'integer', Rule::exists('diplome_types', 'id')],
            'cef' => ['required', 'string', 'max:30', Rule::unique('stagiaires', 'cef')],
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'cin' => ['required', 'string', 'max:30', Rule::unique('stagiaires', 'cin')],
            'email' => ['nullable', 'email', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'date_naissance' => ['nullable', 'date'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'ville' => ['nullable', 'string', 'max:100'],
            'photo' => ['nullable', 'url', 'max:255'],
            'sexe' => ['required', Rule::enum(SexeEnum::class)],
        ];
    }
}
