<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enumerates custom notification categories.
 */
enum NotificationTypeEnum: string
{
    case Autorisation = 'autorisation';
    case Absence = 'absence';
    case System = 'system';
}
