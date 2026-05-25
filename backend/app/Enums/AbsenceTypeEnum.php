<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enumerates absence entry types.
 */
enum AbsenceTypeEnum: string
{
    case Absence = 'absence';
    case Retard = 'retard';
}
