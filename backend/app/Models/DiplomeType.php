<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\DiplomeTypeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a diploma category attached to trainees.
 */
class DiplomeType extends Model
{
    /** @use HasFactory<DiplomeTypeFactory> */
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
     * Get the trainees for the diploma type.
     */
    public function stagiaires(): HasMany
    {
        return $this->hasMany(Stagiaire::class);
    }
}
