<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use App\Http\Requests\ApiRequest;

/**
 * Validates authenticated user avatar updates.
 */
class UpdateAvatarRequest extends ApiRequest
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
        return [
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
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
            'avatar.required' => 'Veuillez choisir une image.',
            'avatar.image' => 'Le fichier doit etre une image valide.',
            'avatar.mimes' => 'Formats autorises : JPG, JPEG, PNG, WEBP.',
            'avatar.max' => 'La taille maximale autorisee est 2 MB.',
        ];
    }
}
