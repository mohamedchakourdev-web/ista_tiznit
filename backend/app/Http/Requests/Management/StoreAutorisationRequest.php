<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Enums\AutorisationStatutEnum;
use App\Http\Requests\ApiRequest;
use App\Models\Absence;
use App\Models\Autorisation;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Validates authorization creation requests.
 */
class StoreAutorisationRequest extends ApiRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['directeur', 'gestionnaire']) ?? false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->input('statut') === 'acceptee') {
            $this->merge([
                'statut' => AutorisationStatutEnum::Validee->value,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'absence_id' => ['nullable', 'integer', Rule::exists('absences', 'id')],
            'stagiaire_id' => ['required_without:absence_id', 'nullable', 'integer', Rule::exists('stagiaires', 'id')],
            'target_user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'statut' => [
                'required_without:absence_id',
                'nullable',
                Rule::in([
                    AutorisationStatutEnum::Validee->value,
                    AutorisationStatutEnum::Refusee->value,
                ]),
            ],
            'motif' => ['required', 'string', 'max:2000'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $absenceId = $this->filled('absence_id') ? (int) $this->input('absence_id') : null;
            $stagiaireId = $this->filled('stagiaire_id') ? (int) $this->input('stagiaire_id') : null;
            $targetUserId = (int) $this->input('target_user_id');

            $absence = $absenceId !== null
                ? Absence::query()->with(['stagiaire.groupe.formateurs', 'groupe.formateurs'])->find($absenceId)
                : null;

            $stagiaire = $absence?->stagiaire;

            if ($stagiaireId !== null) {
                $selectedStagiaire = Stagiaire::query()
                    ->with('groupe.formateurs')
                    ->find($stagiaireId);

                if ($selectedStagiaire === null) {
                    return;
                }

                if ($stagiaire !== null && $selectedStagiaire->id !== $stagiaire->id) {
                    $validator->errors()->add(
                        'stagiaire_id',
                        'Le stagiaire selectionne ne correspond pas a l absence.',
                    );

                    return;
                }

                $stagiaire = $selectedStagiaire;
            }

            if ($absenceId !== null && $absence === null) {
                return;
            }

            if ($stagiaire === null) {
                return;
            }

            $targetUser = User::query()
                ->whereKey($targetUserId)
                ->where('is_active', true)
                ->role('formateur')
                ->first();

            if ($targetUser === null) {
                $validator->errors()->add(
                    'target_user_id',
                    'L utilisateur cible doit etre un formateur actif dans le systeme.',
                );

                return;
            }

            if (! $stagiaire->groupe->formateurs->contains('id', $targetUserId)) {
                $validator->errors()->add(
                    'target_user_id',
                    'Le formateur cible doit etre affecte au groupe de ce stagiaire.',
                );
            }

            if ($absenceId !== null && Autorisation::query()->where('absence_id', $absenceId)->exists()) {
                $validator->errors()->add(
                    'absence_id',
                    'Cette absence possede deja une autorisation.',
                );
            }
        });
    }
}
