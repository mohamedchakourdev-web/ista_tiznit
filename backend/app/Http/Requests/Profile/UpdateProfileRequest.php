<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

/**
 * Validates authenticated user profile updates.
 */
class UpdateProfileRequest extends ApiRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->user()?->getKey();

        return [
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'telephone' => ['nullable', 'string', 'max:30'],
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
            'nom.required' => 'Le nom est obligatoire.',
            'nom.max' => 'Le nom ne doit pas depasser 100 caracteres.',
            'prenom.required' => 'Le prenom est obligatoire.',
            'prenom.max' => 'Le prenom ne doit pas depasser 100 caracteres.',
            'email.required' => 'L adresse email est obligatoire.',
            'email.email' => 'L adresse email doit etre valide.',
            'email.max' => 'L adresse email ne doit pas depasser 255 caracteres.',
            'email.unique' => 'Cette adresse email est deja utilisee.',
            'telephone.max' => 'Le telephone ne doit pas depasser 30 caracteres.',
        ];
    }
}
