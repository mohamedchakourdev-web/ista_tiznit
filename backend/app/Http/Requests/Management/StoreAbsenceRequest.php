<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Enums\AbsenceTypeEnum;
use App\Enums\PeriodeEnum;
use App\Http\Requests\ApiRequest;
use App\Models\Absence;
use App\Models\Stagiaire;
use Closure;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Validates absence creation requests.
 */
class StoreAbsenceRequest extends ApiRequest
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
            'stagiaire_id' => ['required', 'integer', Rule::exists('stagiaires', 'id')],
            'groupe_id' => ['required', 'integer', Rule::exists('groupes', 'id')],
            'date_absence' => ['required', 'date'],
            'periode' => ['required', Rule::enum(PeriodeEnum::class)],
            'type' => ['required', Rule::enum(AbsenceTypeEnum::class)],
            'minutes_retard' => [
                'nullable',
                'integer',
                'min:1',
                Rule::requiredIf(fn (): bool => $this->input('type') === AbsenceTypeEnum::Retard->value),
                Rule::prohibitedIf(fn (): bool => $this->input('type') === AbsenceTypeEnum::Absence->value),
            ],
            'remarque' => ['nullable', 'string'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $stagiaireId = (int) $this->input('stagiaire_id');
            $groupeId = (int) $this->input('groupe_id');
            $dateAbsence = (string) $this->input('date_absence');
            $periode = (string) $this->input('periode');

            $stagiaire = Stagiaire::query()->find($stagiaireId);

            if ($stagiaire === null) {
                return;
            }

            if ($stagiaire->groupe_id !== $groupeId) {
                $validator->errors()->add(
                    'groupe_id',
                    'Le groupe selectionne ne correspond pas au groupe du stagiaire.',
                );
            }

            $slotExists = Absence::query()
                ->where('stagiaire_id', $stagiaireId)
                ->whereDate('date_absence', $dateAbsence)
                ->where('periode', $periode)
                ->exists();

            if ($slotExists) {
                $validator->errors()->add(
                    'stagiaire_id',
                    'Une absence existe deja pour ce stagiaire, cette date et cette periode.',
                );
            }
        });
    }
}
