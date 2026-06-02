<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Enums\AutorisationStatutEnum;
use App\Http\Requests\ApiRequest;
use App\Models\Absence;
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

        // Backward compatibility: accept a single `absence_id` and fold it into
        // the new `absence_ids` collection.
        if (! $this->has('absence_ids') && $this->filled('absence_id')) {
            $this->merge([
                'absence_ids' => [$this->input('absence_id')],
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
            'absence_ids' => ['nullable', 'array'],
            'absence_ids.*' => ['integer', Rule::exists('absences', 'id')],
            'absence_id' => ['nullable', 'integer', Rule::exists('absences', 'id')],
            'stagiaire_id' => ['required_without:absence_ids', 'nullable', 'integer', Rule::exists('stagiaires', 'id')],
            'target_user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'statut' => [
                'required_without:absence_ids',
                'nullable',
                Rule::in([
                    AutorisationStatutEnum::Validee->value,
                    AutorisationStatutEnum::Refusee->value,
                ]),
            ],
            'motif' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $absenceIds = $this->resolveAbsenceIds();
            $stagiaireId = $this->filled('stagiaire_id') ? (int) $this->input('stagiaire_id') : null;
            $targetUserId = (int) $this->input('target_user_id');

            $absences = $absenceIds !== []
                ? Absence::query()->with('stagiaire')->whereKey($absenceIds)->get()
                : collect();

            // Resolve the trainee either from the explicit selection or the absences.
            $stagiaire = null;

            if ($stagiaireId !== null) {
                $stagiaire = Stagiaire::query()->with('groupe.formateurs')->find($stagiaireId);

                if ($stagiaire === null) {
                    return;
                }
            } elseif ($absences->isNotEmpty()) {
                $stagiaire = $absences->first()->stagiaire?->loadMissing('groupe.formateurs');
            }

            if ($stagiaire === null) {
                return;
            }

            // Every selected absence must belong to the resolved trainee.
            foreach ($absences as $absence) {
                if ($absence->stagiaire_id !== $stagiaire->id) {
                    $validator->errors()->add(
                        'absence_ids',
                        'Une absence selectionnee ne correspond pas au stagiaire.',
                    );

                    return;
                }
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

            // An absence can only be justified by a single authorization.
            $alreadyLinked = $absences->first(static fn (Absence $absence): bool => $absence->autorisation_id !== null);

            if ($alreadyLinked !== null) {
                $validator->errors()->add(
                    'absence_ids',
                    'Une absence selectionnee possede deja une autorisation.',
                );
            }
        });
    }

    /**
     * Resolve the unique list of selected absence ids.
     *
     * @return list<int>
     */
    private function resolveAbsenceIds(): array
    {
        $rawIds = $this->input('absence_ids', []);

        if (! is_array($rawIds)) {
            $rawIds = [$rawIds];
        }

        return array_values(array_unique(array_map('intval', array_filter($rawIds, static fn ($id): bool => $id !== null && $id !== ''))));
    }
}
