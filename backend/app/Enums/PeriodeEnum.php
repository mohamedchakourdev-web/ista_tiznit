<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enumerates attendance periods.
 */
enum PeriodeEnum: string
{
    case Matin = 'matin';
    case ApresMidi = 'apres_midi';
}
