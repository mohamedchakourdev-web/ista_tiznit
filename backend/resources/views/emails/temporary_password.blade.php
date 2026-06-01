@component('mail::message')
# Bonjour {{ $user->prenom }} {{ $user->nom }},

Vous avez demandé un nouveau mot de passe pour votre compte **OFPPT - Gestion des Absences**.

Voici votre mot de passe temporaire :
@component('mail::panel')
**{{ $temporaryPassword }}**
@endcomponent

Pour des raisons de sécurité, nous vous conseillons vivement de vous connecter et de modifier ce mot de passe depuis les paramètres de votre profil.

@component('mail::button', ['url' => env('FRONTEND_URL', 'http://localhost:3000') . '/login'])
Se connecter à la plateforme
@endcomponent

Merci,<br>
L'équipe {{ config('app.name') }}
@endcomponent
