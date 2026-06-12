<?php

declare(strict_types=1);

namespace App\Enums;

enum GroupeNiveauEnum: string
{
    case PremiereAnnee = '1ère année';
    case DeuxiemeAnnee = '2ème année';
    case TroisiemeAnnee = '3ème année';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $niveau): string => $niveau->value,
            self::cases(),
        );
    }

    public static function normalize(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_scalar($value) && ! $value instanceof \Stringable) {
            return null;
        }

        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        foreach (self::cases() as $niveau) {
            if ($niveau->value === $value) {
                return $niveau->value;
            }
        }

        $key = mb_strtolower($value);

        if (function_exists('iconv')) {
            $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $key);

            if ($ascii !== false) {
                $key = $ascii;
            }
        }

        $key = preg_replace('/[^a-z0-9]+/', '', $key) ?? '';

        return match ($key) {
            '1', '1a', '1ere', '1ereannee', 'premiereannee' => self::PremiereAnnee->value,
            '2', '2a', '2eme', '2emeannee', 'deuxiemeannee' => self::DeuxiemeAnnee->value,
            '3', '3a', '3eme', '3emeannee', 'troisiemeannee' => self::TroisiemeAnnee->value,
            default => null,
        };
    }
}
