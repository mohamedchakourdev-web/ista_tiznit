<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\GroupeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a learner group.
 */
class Groupe extends Model
{
    /** @use HasFactory<GroupeFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'filiere_id',
        'nom',
        'code',
        'annee_formation',
        'niveau',
        'capacite',
    ];

    /**
     * Get the parent filiere.
     */
    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    /**
     * Get the trainers assigned to the group.
     */
    public function formateurs(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'formateur_groupes')
            ->using(FormateurGroupe::class)
            ->withPivot(['id', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Get the learners registered in the group.
     */
    public function stagiaires(): HasMany
    {
        return $this->hasMany(Stagiaire::class);
    }

    /**
     * Get the absences recorded for the group.
     */
    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class);
    }
}
