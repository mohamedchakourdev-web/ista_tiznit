<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Http\Requests\ApiRequest;
use App\Models\User;
use Closure;
use Illuminate\Validation\Rule;

/**
 * Validates group update requests.
 */
class UpdateGroupeRequest extends ApiRequest
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
        $groupeId = (int) $this->route('groupeId');

        return [
            'filiere_id' => ['sometimes', 'required', 'integer', Rule::exists('filieres', 'id')],
            'nom' => ['sometimes', 'required', 'string', 'max:120'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:60',
                Rule::unique('groupes', 'code')->ignore($groupeId),
            ],
            'annee_formation' => ['sometimes', 'required', 'string', 'max:20'],
            'niveau' => ['sometimes', 'required', 'string', 'max:50'],
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
}
