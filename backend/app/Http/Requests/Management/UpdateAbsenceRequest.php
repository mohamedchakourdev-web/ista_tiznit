<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Enums\AbsenceTypeEnum;
use App\Enums\PeriodeEnum;
use App\Http\Requests\ApiRequest;
use App\Models\Absence;
use App\Models\Stagiaire;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Validates absence update requests.
 */
class UpdateAbsenceRequest extends ApiRequest
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
            'stagiaire_id' => ['sometimes', 'required', 'integer', Rule::exists('stagiaires', 'id')],
            'groupe_id' => ['sometimes', 'required', 'integer', Rule::exists('groupes', 'id')],
            'date_absence' => ['sometimes', 'required', 'date'],
            'periode' => ['sometimes', 'required', Rule::enum(PeriodeEnum::class)],
            'type' => ['sometimes', 'required', Rule::enum(AbsenceTypeEnum::class)],
            'minutes_retard' => ['nullable', 'integer', 'min:1'],
            'remarque' => ['nullable', 'string'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $absenceId = (int) $this->route('absenceId');
            $absence = Absence::query()->find($absenceId);

            if ($absence === null) {
                return;
            }

            $stagiaireId = $this->filled('stagiaire_id')
                ? (int) $this->input('stagiaire_id')
                : $absence->stagiaire_id;
            $groupeId = $this->filled('groupe_id')
                ? (int) $this->input('groupe_id')
                : $absence->groupe_id;
            $dateAbsence = $this->filled('date_absence')
                ? (string) $this->input('date_absence')
                : $absence->date_absence->toDateString();
            $periode = $this->filled('periode')
                ? (string) $this->input('periode')
                : $absence->periode->value;
            $type = $this->filled('type')
                ? (string) $this->input('type')
                : $absence->type->value;

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

            $minutesRetardProvided = array_key_exists('minutes_retard', $this->all());
            $minutesRetard = $minutesRetardProvided
                ? $this->input('minutes_retard')
                : $absence->minutes_retard;

            if ($type === AbsenceTypeEnum::Retard->value && ($minutesRetard === null || (int) $minutesRetard < 1)) {
                $validator->errors()->add(
                    'minutes_retard',
                    'Les minutes de retard sont obligatoires pour un retard.',
                );
            }

            if ($type === AbsenceTypeEnum::Absence->value && $minutesRetardProvided && $minutesRetard !== null) {
                $validator->errors()->add(
                    'minutes_retard',
                    'Les minutes de retard ne sont pas autorisees pour une absence.',
                );
            }

            $slotExists = Absence::query()
                ->whereKeyNot($absenceId)
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
