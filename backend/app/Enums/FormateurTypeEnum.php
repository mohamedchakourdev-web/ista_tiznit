<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enumerates trainer contract types.
 */
enum FormateurTypeEnum: string
{
    case Vacataire = 'vacataire';
    case Permanent = 'permanent';
}
