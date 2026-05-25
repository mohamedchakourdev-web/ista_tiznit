<?php

declare(strict_types=1);

namespace App\Http\Requests\Formateur;

use App\Enums\AutorisationStatutEnum;
use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

/**
 * Validates trainer authorization decision requests.
 */
class UpdateAutorisationStatusRequest extends ApiRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['directeur', 'formateur']) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'statut' => [
                'required',
                Rule::in([
                    AutorisationStatutEnum::Validee->value,
                    AutorisationStatutEnum::Refusee->value,
                ]),
            ],
        ];
    }
}
