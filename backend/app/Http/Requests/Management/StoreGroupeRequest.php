<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Enums\GroupeNiveauEnum;
use App\Http\Requests\ApiRequest;
use App\Models\User;
use Closure;
use Illuminate\Validation\Rule;

/**
 * Validates group creation requests.
 */
class StoreGroupeRequest extends ApiRequest
{
    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('niveau')) {
            $normalizedNiveau = GroupeNiveauEnum::normalize($this->input('niveau'));
            $data['niveau'] = $normalizedNiveau ?? $this->input('niveau');
        }

        if ($this->has('annee_formation')) {
            $anneeFormation = $this->input('annee_formation');
            $data['annee_formation'] = is_scalar($anneeFormation) || $anneeFormation instanceof \Stringable
                ? trim((string) $anneeFormation)
                : $anneeFormation;
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

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
            'filiere_id' => ['required', 'integer', Rule::exists('filieres', 'id')],
            'nom' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:60', Rule::unique('groupes', 'code')],
            'annee_formation' => ['required', 'string', 'max:20', 'regex:/^[0-9]+$/'],
            'niveau' => ['required', 'string', Rule::in(GroupeNiveauEnum::values())],
            'capacite' => ['nullable', 'integer', 'min:1', 'max:100'],
            'formateur_ids' => ['nullable', 'array'],
            'formateur_ids.*' => [
                'integer',
                Rule::exists('users', 'id'),
                static function (string $attribute, mixed $value, Closure $fail): void {
                    $isTrainer = User::query()
                        ->whereKey($value)
                        ->where('is_active', true)
                        ->role('formateur')
                        ->exists();

                    if (! $isTrainer) {
                        $fail('Chaque formateur selectionne doit etre un formateur actif.');
                    }
                },
            ],
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
            'annee_formation.regex' => 'L\'année de formation doit contenir uniquement des chiffres.',
            'niveau.in' => 'Le niveau doit être 1ère année, 2ème année ou 3ème année.',
        ];
    }
}
