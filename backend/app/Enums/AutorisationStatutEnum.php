<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enumerates authorization statuses.
 */
enum AutorisationStatutEnum: string
{
    case EnAttente = 'en_attente';
    case Validee = 'validee';
    case Refusee = 'refusee';
}
