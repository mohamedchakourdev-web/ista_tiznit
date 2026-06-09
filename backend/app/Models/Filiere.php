<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\FiliereFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents an OFPPT training stream.
 */
class Filiere extends Model
{
    /** @use HasFactory<FiliereFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nom',
        'code',
        'description',
    ];

    /**
     * Cascade soft deletes down the ownership chain.
     *
     * Every model in the chain uses SoftDeletes, so the database-level
     * ON DELETE CASCADE rules only fire on a hard delete. On a soft delete we
     * propagate the delete to the groupes, which in turn cascade to their
     * stagiaires, absences and autorisations. A force delete is left to the
     * database foreign keys.
     */
    protected static function booted(): void
    {
        static::deleting(function (Filiere $filiere): void {
            if ($filiere->isForceDeleting()) {
                return;
            }

            $filiere->groupes()->get()->each->delete();
        });
    }

    /**
     * Get the groups attached to the filiere.
     */
    public function groupes(): HasMany
    {
        return $this->hasMany(Groupe::class);
    }
}
