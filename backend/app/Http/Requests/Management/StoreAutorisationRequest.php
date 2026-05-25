<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Http\Requests\ApiRequest;
use App\Models\Absence;
use App\Models\Autorisation;
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
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'absence_id' => ['required', 'integer', Rule::exists('absences', 'id')],
            'target_user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'motif' => ['nullable', 'string'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $absenceId = (int) $this->input('absence_id');
            $targetUserId = (int) $this->input('target_user_id');

            $absence = Absence::query()->with('groupe.formateurs')->find($absenceId);

            if ($absence === null) {
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

            if (! $absence->groupe->formateurs->contains('id', $targetUserId)) {
                $validator->errors()->add(
                    'target_user_id',
                    'Le formateur cible doit etre affecte au groupe de cette absence.',
                );
            }

            if (Autorisation::query()->where('absence_id', $absenceId)->exists()) {
                $validator->errors()->add(
                    'absence_id',
                    'Cette absence possede deja une autorisation.',
                );
            }
        });
    }
}
