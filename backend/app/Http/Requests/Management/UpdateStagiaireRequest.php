<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Enums\SexeEnum;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

/**
 * Validates trainee update requests.
 */
class UpdateStagiaireRequest extends ApiRequest
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
        $stagiaireId = (int) $this->route('stagiaireId');

        return [
            'groupe_id' => ['sometimes', 'required', 'integer', Rule::exists('groupes', 'id')],
            'diplome_type_id' => ['sometimes', 'required', 'integer', Rule::exists('diplome_types', 'id')],
            'cef' => ['sometimes', 'required', 'string', 'max:30', Rule::unique('stagiaires', 'cef')->ignore($stagiaireId)],
            'nom' => ['sometimes', 'required', 'string', 'max:100'],
            'prenom' => ['sometimes', 'required', 'string', 'max:100'],
            'cin' => ['sometimes', 'required', 'string', 'max:30', Rule::unique('stagiaires', 'cin')->ignore($stagiaireId)],
            'email' => ['nullable', 'email', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9]+$/'],
            'date_naissance' => ['nullable', 'date'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'ville' => ['nullable', 'string', 'max:100'],
            'photo' => ['nullable', 'url', 'max:255'],
            'sexe' => ['sometimes', 'required', Rule::enum(SexeEnum::class)],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'telephone.regex' => 'Le numéro de téléphone doit contenir uniquement des chiffres.',
        ];
    }
}
