<?php

declare(strict_types=1);

namespace App\Imports;

use App\Enums\SexeEnum;
use App\Models\Stagiaire;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithSkipDuplicates;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Validators\Failure;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Throwable;

class StagiairesImport implements ShouldQueue, SkipsEmptyRows, SkipsOnError, SkipsOnFailure, ToModel, WithBatchInserts, WithChunkReading, WithHeadingRow, WithSkipDuplicates, WithValidation
{
    /**
     * Convert one Excel row into a trainee model.
     *
     * @param  array<string, mixed>  $row
     */
    public function model(array $row): Stagiaire
    {
        $row = $this->prepareRow($row);

        return new Stagiaire([
            'nom' => $row['nom'],
            'prenom' => $row['prenom'],
            'cef' => $row['cef'],
            'cin' => $row['cin'],
            'email' => $row['email'],
            'telephone' => $row['telephone'],
            'adresse' => $row['adresse'],
            'date_naissance' => $row['date_naissance'],
            'groupe_id' => $row['groupe_id'],
            'diplome_type_id' => $row['diplome_type_id'],
            'sexe' => $row['sexe'] ?? SexeEnum::Homme->value,
        ]);
    }

    /**
     * Normalize row values before validation.
     *
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    public function prepareForValidation(array $row, int $index): array
    {
        return $this->prepareRow($row);
    }

    /**
     * Ignore rows that are effectively empty after trimming.
     *
     * @param  array<string, mixed>  $row
     */
    public function isEmptyWhen(array $row): bool
    {
        foreach ($this->prepareRow($row) as $value) {
            if ($value !== null && $value !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * Validation rules for each Excel row.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'cef' => ['required', 'string', 'max:30', Rule::unique('stagiaires', 'cef')],
            'cin' => ['required', 'string', 'max:30', Rule::unique('stagiaires', 'cin')],
            'email' => ['nullable', 'email', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'date_naissance' => ['nullable', 'date'],
            'groupe_id' => ['required', 'integer', Rule::exists('groupes', 'id')],
            'diplome_type_id' => ['required', 'integer', Rule::exists('diplome_types', 'id')],
            'sexe' => ['nullable', Rule::enum(SexeEnum::class)],
        ];
    }

    /**
     * Log invalid rows without stopping the import.
     */
    public function onFailure(Failure ...$failures): void
    {
        foreach ($failures as $failure) {
            Log::warning('Ligne stagiaire ignoree pendant l\'import.', [
                'row' => $failure->row(),
                'attribute' => $failure->attribute(),
                'errors' => $failure->errors(),
                'values' => $failure->values(),
            ]);
        }
    }

    /**
     * Log unexpected row-level errors without stopping the import.
     */
    public function onError(Throwable $e): void
    {
        Log::error('Erreur pendant l\'import des stagiaires.', [
            'message' => $e->getMessage(),
        ]);
    }

    /**
     * Number of rows inserted per query.
     */
    public function batchSize(): int
    {
        return 500;
    }

    /**
     * Number of rows read per chunk.
     */
    public function chunkSize(): int
    {
        return 500;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function prepareRow(array $row): array
    {
        return [
            'nom' => $this->stringValue($row['nom'] ?? null),
            'prenom' => $this->stringValue($row['prenom'] ?? null),
            'cef' => $this->stringValue($row['cef'] ?? null),
            'cin' => $this->upperValue($row['cin'] ?? null),
            'email' => $this->lowerValue($row['email'] ?? null),
            'telephone' => $this->stringValue($row['telephone'] ?? null),
            'adresse' => $this->stringValue($row['adresse'] ?? null),
            'date_naissance' => $this->dateValue($row['date_naissance'] ?? null),
            'groupe_id' => $this->integerValue($row['groupe_id'] ?? null),
            'diplome_type_id' => $this->integerValue($row['diplome_type_id'] ?? null),
            'sexe' => $this->lowerValue($row['sexe'] ?? null),
        ];
    }

    private function dateValue(mixed $value): ?string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        if (is_numeric($value)) {
            return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
        }

        return $this->stringValue($value);
    }

    private function integerValue(mixed $value): int|string|null
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return (int) $value;
        }

        return $this->stringValue($value);
    }

    private function lowerValue(mixed $value): ?string
    {
        $value = $this->stringValue($value);

        return $value === null ? null : mb_strtolower($value);
    }

    private function stringValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function upperValue(mixed $value): ?string
    {
        $value = $this->stringValue($value);

        return $value === null ? null : mb_strtoupper($value);
    }
}
