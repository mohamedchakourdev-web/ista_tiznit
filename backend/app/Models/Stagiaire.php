<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SexeEnum;
use Database\Factories\StagiaireFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a trainee enrolled in a group.
 */
class Stagiaire extends Model
{
    /** @use HasFactory<StagiaireFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'groupe_id',
        'diplome_type_id',
        'cef',
        'nom',
        'prenom',
        'cin',
        'email',
        'telephone',
        'date_naissance',
        'adresse',
        'ville',
        'photo',
        'sexe',
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
            'date_naissance' => 'date',
            'sexe' => SexeEnum::class,
        ];
    }

    /**
     * Get the group of the trainee.
     */
    public function groupe(): BelongsTo
    {
        return $this->belongsTo(Groupe::class);
    }

    /**
     * Get the diploma type of the trainee.
     */
    public function diplomeType(): BelongsTo
    {
        return $this->belongsTo(DiplomeType::class);
    }

    /**
     * Get the absences attached to the trainee.
     */
    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class);
    }

    /**
     * Get the user who created the trainee.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the trainee.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the user who soft deleted the trainee.
     */
    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
