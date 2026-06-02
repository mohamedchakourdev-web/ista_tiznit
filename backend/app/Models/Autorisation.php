<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AutorisationStatutEnum;
use Database\Factories\AutorisationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents an authorization request addressed to a specific trainer.
 */
class Autorisation extends Model
{
    /** @use HasFactory<AutorisationFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'stagiaire_id',
        'target_user_id',
        'code',
        'motif',
        'statut',
        'date_validation',
        'validated_by',
        'is_read',
        'read_at',
        'read_by',
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
            'statut' => AutorisationStatutEnum::class,
            'date_validation' => 'datetime',
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    /**
     * Get every absence covered by the authorization.
     */
    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class);
    }

    /**
     * Get the primary (oldest) absence covered by the authorization.
     *
     * Kept for backward-compatible display of a single representative absence;
     * it reads the same source of truth as {@see self::absences()}.
     */
    public function absence(): HasOne
    {
        return $this->hasOne(Absence::class)->oldestOfMany();
    }

    /**
     * Get the trainee linked to the authorization.
     */
    public function stagiaire(): BelongsTo
    {
        return $this->belongsTo(Stagiaire::class);
    }

    /**
     * Get the targeted trainer.
     */
    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    /**
     * Get the user who validated or refused the authorization.
     */
    public function validatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /**
     * Get the user who marked the authorization as read.
     */
    public function readByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'read_by');
    }

    /**
     * Get the user who created the authorization.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the authorization.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the user who soft deleted the authorization.
     */
    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
