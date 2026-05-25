<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AbsenceTypeEnum;
use App\Enums\PeriodeEnum;
use Database\Factories\AbsenceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents an absence or lateness entry.
 */
class Absence extends Model
{
    /** @use HasFactory<AbsenceFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'stagiaire_id',
        'groupe_id',
        'date_absence',
        'periode',
        'type',
        'minutes_retard',
        'remarque',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * Get the attribute casts for the model.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_absence' => 'date',
            'periode' => PeriodeEnum::class,
            'type' => AbsenceTypeEnum::class,
        ];
    }

    /**
     * Get the trainee related to the absence.
     */
    public function stagiaire(): BelongsTo
    {
        return $this->belongsTo(Stagiaire::class);
    }

    /**
     * Get the group related to the absence.
     */
    public function groupe(): BelongsTo
    {
        return $this->belongsTo(Groupe::class);
    }

    /**
     * Get the authorization attached to the absence.
     */
    public function autorisation(): HasOne
    {
        return $this->hasOne(Autorisation::class);
    }

    /**
     * Get the user who created the absence.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the absence.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the user who soft deleted the absence.
     */
    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
