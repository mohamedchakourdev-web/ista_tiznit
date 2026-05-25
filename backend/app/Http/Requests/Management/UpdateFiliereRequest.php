<?php

declare(strict_types=1);

namespace App\Http\Requests\Management;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

/**
 * Validates filiere update requests.
 */
class UpdateFiliereRequest extends ApiRequest
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
        $filiereId = (int) $this->route('filiereId');

        return [
            'nom' => ['sometimes', 'required', 'string', 'max:150'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('filieres', 'code')->ignore($filiereId),
            ],
            'description' => ['nullable', 'string'],
        ];
    }
}
