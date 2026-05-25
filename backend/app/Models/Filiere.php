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
     * Get the groups attached to the filiere.
     */
    public function groupes(): HasMany
    {
        return $this->hasMany(Groupe::class);
    }
}
