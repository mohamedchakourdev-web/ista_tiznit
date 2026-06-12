<?php

declare(strict_types=1);

namespace App\Imports;

use App\Enums\SexeEnum;
use App\Models\DiplomeType;
use App\Models\Groupe;
use App\Models\Stagiaire;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\RegistersEventListeners;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithSkipDuplicates;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Validators\Failure;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Throwable;

class StagiairesImport implements SkipsEmptyRows, SkipsOnError, SkipsOnFailure, ToModel, WithBatchInserts, WithChunkReading, WithEvents, WithHeadingRow, WithSkipDuplicates, WithValidation
{
    use RegistersEventListeners;

    private const MAX_REPORT_ERRORS = 100;

    private int $importedRows = 0;

    private int $skippedRows = 0;

    private int $errorCount = 0;

    /** @var array<int, bool> */
    private array $skippedRowNumbers = [];

    /** @var list<array<string, mixed>> */
    private array $errors = [];

    /** @var array<string, int>|null */
    private ?array $groupeCodes = null;

    /** @var array<string, int>|null */
    private ?array $groupeNames = null;

    /** @var array<string, int>|null */
    private ?array $diplomeCodes = null;

    /** @var array<string, int>|null */
    private ?array $diplomeNames = null;

    /**
     * Convert one Excel row into a trainee model.
     *
     * @param  array<string, mixed>  $row
     */
    public function model(array $row): Stagiaire
    {
        $row = $this->prepareRow($row);
        $this->importedRows++;

        return new Stagiaire([
            'nom' => $row['nom'],
            'prenom' => $row['prenom'],
            'cef' => $row['cef'],
            'cin' => $row['cin'],
            'email' => $row['email'],
            'telephone' => $row['telephone'],
            'adresse' => $row['adresse'],
            'ville' => $row['ville'],
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
            'cef' => ['required', 'string', 'max:30', 'distinct', Rule::unique('stagiaires', 'cef')],
            'cin' => ['required', 'string', 'max:30', 'distinct', Rule::unique('stagiaires', 'cin')],
            'email' => ['nullable', 'email', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9]+$/'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'ville' => ['nullable', 'string', 'max:100'],
            'date_naissance' => ['nullable', 'date'],
            'groupe_id' => ['required', 'integer', Rule::exists('groupes', 'id')],
            'diplome_type_id' => ['required', 'integer', Rule::exists('diplome_types', 'id')],
            'sexe' => ['nullable', Rule::enum(SexeEnum::class)],
        ];
    }

    /**
     * Human-readable validation messages for the import log.
     *
     * @return array<string, string>
     */
    public function customValidationMessages(): array
    {
        return [
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prenom est obligatoire.',
            'cef.required' => 'Le champ CEF est obligatoire.',
            'cef.unique' => 'CEF déjà existant.',
            'cef.distinct' => 'CEF en double dans le fichier.',
            'cin.required' => 'La CIN est obligatoire. Si elle est absente, MatriculeEtudiant est utilise comme valeur de secours.',
            'cin.unique' => 'Cette CIN existe déjà.',
            'cin.distinct' => 'CIN en double dans le fichier.',
            'groupe_id.required' => 'Aucun groupe correspondant au CodeGroupe, NomGroupe ou Groupe fourni.',
            'groupe_id.exists' => 'Le groupe resolu est introuvable.',
            'diplome_type_id.required' => 'Aucun type de diplome correspondant au CodeDiplome fourni.',
            'diplome_type_id.exists' => 'Le type de diplome resolu est introuvable.',
            'email.email' => 'Email invalide.',
            'sexe' => 'Le sexe doit etre homme ou femme.',
            'telephone.regex' => 'Le numéro de téléphone doit contenir uniquement des chiffres.',
        ];
    }

    /**
     * Human-readable field names for import failures.
     *
     * @return array<string, string>
     */
    public function customValidationAttributes(): array
    {
        return [
            'nom' => 'Nom',
            'prenom' => 'Prenom',
            'cef' => 'MatriculeEtudiant',
            'cin' => 'CIN',
            'groupe_id' => 'Groupe',
            'diplome_type_id' => 'CodeDiplome',
            'sexe' => 'Sexe',
        ];
    }

    /**
     * Log invalid rows without stopping the import.
     */
    public function onFailure(Failure ...$failures): void
    {
        foreach ($failures as $failure) {
            $this->recordSkippedRow($failure->row());

            $contexts = [];

            foreach ($failure->errors() as $message) {
                $values = $failure->values();

                $contexts[] = [
                    'row' => $failure->row(),
                    'field' => $this->fieldLabel((string) $failure->attribute()),
                    'message' => $this->formatFailureMessage((string) $failure->attribute(), $message, $values),
                    'values' => $this->reportValues($values),
                ];
            }

            foreach ($contexts as $context) {
                $this->recordError($context);
            }

            Log::warning('Import stagiaires - ligne ignoree.', [
                'row' => $failure->row(),
                'field' => $this->fieldLabel((string) $failure->attribute()),
                'errors' => $failure->errors(),
                'values' => $this->reportValues($failure->values()),
            ]);
        }
    }

    /**
     * Log unexpected row-level errors without stopping the import.
     */
    public function onError(Throwable $e): void
    {
        $context = [
            'row' => null,
            'field' => null,
            'message' => $e->getMessage(),
        ];

        $this->recordError($context);

        Log::error('Import stagiaires - erreur inattendue.', $context);
    }

    /**
     * Log a readable report once the file has been processed.
     */
    public function afterImport(AfterImport $event): void
    {
        Log::info('Rapport import stagiaires.', [
            'lignes_importees' => $this->importedRows,
            'lignes_ignorees' => $this->skippedRows,
            'erreurs_total' => $this->errorCount,
            'erreurs' => $this->errors,
        ]);
    }

    /**
     * Structured result consumed by the HTTP import endpoint.
     *
     * @return array{imported: int, failed: int, error_count: int, errors: list<array<string, mixed>>}
     */
    public function report(): array
    {
        return [
            'imported' => $this->importedRows,
            'failed' => $this->skippedRows,
            'error_count' => $this->errorCount,
            'errors' => $this->errors,
        ];
    }

    public function addGlobalError(string $message): void
    {
        $this->recordError([
            'row' => null,
            'field' => null,
            'message' => $message,
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
        $matricule = $this->stringValue($this->firstValue($row, [
            'cef',
            'MatriculeEtudiant',
            'Matricule Etudiant',
            'Matricule etudiant',
            'Matricule',
            'NumeroEtudiant',
            'Numero Etudiant',
        ]));
        $cin = $this->upperValue($this->firstValue($row, [
            'cin',
            'cni',
            'Numero CIN',
            'Numero CNI',
            'CIN Etudiant',
        ]));
        $groupeId = $this->firstValue($row, ['groupe_id', 'IdGroupe']);
        $groupeCode = $this->firstValue($row, ['CodeGroupe', 'Code Groupe', 'GroupeCode']);
        $groupeName = $this->firstValue($row, ['NomGroupe', 'Nom Groupe', 'Groupe', 'LibelleGroupe']);
        $diplomeTypeId = $this->firstValue($row, ['diplome_type_id', 'IdDiplomeType']);
        $diplomeCode = $this->firstValue($row, ['CodeDiplome', 'Code Diplome', 'DiplomeCode', 'TypeDiplome', 'Type Diplome']);

        return [
            'nom' => $this->stringValue($this->firstValue($row, [
                'nom',
                'NomEtudiant',
                'Nom Etudiant',
                'NomStagiaire',
                'Nom Stagiaire',
            ])),
            'prenom' => $this->stringValue($this->firstValue($row, [
                'prenom',
                'Prenom',
                'PrenomEtudiant',
                'Prenom Etudiant',
                'PrenomStagiaire',
                'Prenom Stagiaire',
            ])),
            'cef' => $matricule,
            'cin' => $cin ?? $this->upperValue($matricule),
            'email' => $this->lowerValue($this->firstValue($row, [
                'email',
                'e-mail',
                'mail',
                'Adresse Email',
                'EmailEtudiant',
            ])),
            'telephone' => $this->stringValue($this->firstValue($row, [
                'telephone',
                'tel',
                'gsm',
                'portable',
                'TelephoneEtudiant',
            ])),
            'adresse' => $this->stringValue($this->firstValue($row, [
                'adresse',
                'AdresseEtudiant',
            ])),
            'ville' => $this->stringValue($this->firstValue($row, [
                'ville',
                'VilleEtudiant',
            ])),
            'date_naissance' => $this->dateValue($this->firstValue($row, [
                'date_naissance',
                'DateNaissance',
                'Date Naissance',
                'DateNaissanceEtudiant',
                'Date de naissance',
            ])),
            'groupe_id' => $this->resolveGroupeId($groupeId, $groupeCode, $groupeName),
            'groupe_reference' => $this->stringValue($groupeCode) ?? $this->stringValue($groupeName) ?? $this->stringValue($groupeId),
            'diplome_type_id' => $this->resolveDiplomeTypeId($diplomeTypeId, $diplomeCode),
            'diplome_reference' => $this->stringValue($diplomeCode) ?? $this->stringValue($diplomeTypeId),
            'sexe' => $this->sexeValue($this->firstValue($row, [
                'sexe',
                'genre',
                'civilite',
            ])),
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  list<string>  $aliases
     */
    private function firstValue(array $row, array $aliases): mixed
    {
        $values = [];

        foreach ($row as $key => $value) {
            $values[$this->normalizeLookupKey((string) $key)] = $value;
        }

        foreach ($aliases as $alias) {
            $key = $this->normalizeLookupKey($alias);

            if (array_key_exists($key, $values) && ! $this->isBlank($values[$key])) {
                return $values[$key];
            }
        }

        return null;
    }

    private function resolveGroupeId(mixed $technicalId, mixed $code, mixed $name): ?int
    {
        $id = $this->integerValue($technicalId);

        if ($id !== null && Groupe::query()->whereKey($id)->exists()) {
            return $id;
        }

        $codeKey = $this->normalizeLookupValue($code);
        $nameKey = $this->normalizeLookupValue($name);

        if ($codeKey === null && $nameKey === null) {
            return null;
        }

        $this->loadGroupeLookups();

        if ($codeKey !== null && isset($this->groupeCodes[$codeKey])) {
            return $this->groupeCodes[$codeKey];
        }

        if ($codeKey !== null && isset($this->groupeNames[$codeKey])) {
            return $this->groupeNames[$codeKey];
        }

        if ($nameKey !== null && isset($this->groupeNames[$nameKey])) {
            return $this->groupeNames[$nameKey];
        }

        if ($nameKey !== null && isset($this->groupeCodes[$nameKey])) {
            return $this->groupeCodes[$nameKey];
        }

        return null;
    }

    private function resolveDiplomeTypeId(mixed $technicalId, mixed $code): ?int
    {
        $id = $this->integerValue($technicalId);

        if ($id !== null && DiplomeType::query()->whereKey($id)->exists()) {
            return $id;
        }

        $codeKey = $this->normalizeLookupValue($code);
        if ($codeKey === null) {
            return null;
        }

        $this->loadDiplomeLookups();

        if (isset($this->diplomeCodes[$codeKey])) {
            return $this->diplomeCodes[$codeKey];
        }

        if (isset($this->diplomeNames[$codeKey])) {
            return $this->diplomeNames[$codeKey];
        }

        foreach ($this->diplomeCodes as $diplomeCode => $diplomeId) {
            if (str_starts_with($codeKey, $diplomeCode)) {
                return $diplomeId;
            }
        }

        return null;
    }

    private function loadGroupeLookups(): void
    {
        if ($this->groupeCodes !== null && $this->groupeNames !== null) {
            return;
        }

        $this->groupeCodes = [];
        $this->groupeNames = [];

        Groupe::query()
            ->get(['id', 'code', 'nom'])
            ->each(function (Groupe $groupe): void {
                $this->groupeCodes[$this->normalizeLookupKey($groupe->code)] = $groupe->id;
                $this->groupeNames[$this->normalizeLookupKey($groupe->nom)] = $groupe->id;
            });
    }

    private function loadDiplomeLookups(): void
    {
        if ($this->diplomeCodes !== null && $this->diplomeNames !== null) {
            return;
        }

        $this->diplomeCodes = [];
        $this->diplomeNames = [];

        DiplomeType::query()
            ->get(['id', 'code', 'nom'])
            ->sortByDesc(fn (DiplomeType $diplomeType): int => strlen($diplomeType->code))
            ->each(function (DiplomeType $diplomeType): void {
                $this->diplomeCodes[$this->normalizeLookupKey($diplomeType->code)] = $diplomeType->id;
                $this->diplomeNames[$this->normalizeLookupKey($diplomeType->nom)] = $diplomeType->id;
            });
    }

    private function dateValue(mixed $value): ?string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        if (is_numeric($value)) {
            return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
        }

        $value = $this->stringValue($value);

        if ($value === null) {
            return null;
        }

        foreach (['Y-m-d', 'd/m/Y', 'd-m-Y', 'm/d/Y'] as $format) {
            $date = \DateTimeImmutable::createFromFormat($format, $value);

            if ($date instanceof \DateTimeImmutable) {
                return $date->format('Y-m-d');
            }
        }

        return $value;
    }

    private function integerValue(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return (int) $value;
        }

        return null;
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

    private function sexeValue(mixed $value): ?string
    {
        $key = $this->normalizeLookupValue($value);

        return match ($key) {
            'homme', 'masculin', 'male', 'm' => SexeEnum::Homme->value,
            'femme', 'feminin', 'female', 'f' => SexeEnum::Femme->value,
            default => $this->lowerValue($value),
        };
    }

    private function normalizeLookupValue(mixed $value): ?string
    {
        $value = $this->stringValue($value);

        return $value === null ? null : $this->normalizeLookupKey($value);
    }

    private function normalizeLookupKey(string $value): string
    {
        $value = mb_strtolower($value);

        if (function_exists('iconv')) {
            $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);

            if ($ascii !== false) {
                $value = $ascii;
            }
        }

        return preg_replace('/[^a-z0-9]+/', '', $value) ?? '';
    }

    private function isBlank(mixed $value): bool
    {
        return $value === null || (is_string($value) && trim($value) === '');
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function recordError(array $context): void
    {
        $this->errorCount++;

        if (count($this->errors) < self::MAX_REPORT_ERRORS) {
            $this->errors[] = $context;
        }
    }

    private function recordSkippedRow(int $rowNumber): void
    {
        if (isset($this->skippedRowNumbers[$rowNumber])) {
            return;
        }

        $this->skippedRowNumbers[$rowNumber] = true;
        $this->skippedRows++;
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function reportValues(array $values): array
    {
        return [
            'nom' => $values['nom'] ?? null,
            'prenom' => $values['prenom'] ?? null,
            'matricule' => $values['cef'] ?? null,
            'cin' => $values['cin'] ?? null,
            'groupe_id' => $values['groupe_id'] ?? null,
            'groupe_reference' => $values['groupe_reference'] ?? null,
            'diplome_type_id' => $values['diplome_type_id'] ?? null,
            'diplome_reference' => $values['diplome_reference'] ?? null,
        ];
    }

    private function fieldLabel(string $field): string
    {
        $attributes = $this->customValidationAttributes();

        return $attributes[$field] ?? $field;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function formatFailureMessage(string $field, string $message, array $values): string
    {
        if ($field === 'groupe_id' && ! $this->isBlank($values['groupe_reference'] ?? null)) {
            return sprintf('Le groupe %s n\'existe pas.', (string) $values['groupe_reference']);
        }

        if ($field === 'diplome_type_id' && ! $this->isBlank($values['diplome_reference'] ?? null)) {
            return sprintf('Le type de diplome %s n\'existe pas.', (string) $values['diplome_reference']);
        }

        return $message;
    }
}
