<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FormateurTypeEnum;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * Represents a platform user with role-based access control.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, SoftDeletes;

    /**
     * The guard used by Spatie Permission.
     *
     * @var string
     */
    protected string $guard_name = 'web';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'avatar',
        'password',
        'type',
        'last_login_at',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attribute casts for the model.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => FormateurTypeEnum::class,
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the groups assigned to the trainer.
     */
    public function groupes(): BelongsToMany
    {
        return $this->belongsToMany(Groupe::class, 'formateur_groupes')
            ->using(FormateurGroupe::class)
            ->withPivot(['id', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Get the notifications received by the user.
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get the authorizations addressed to the user.
     */
    public function targetAutorisations(): HasMany
    {
        return $this->hasMany(Autorisation::class, 'target_user_id');
    }

    /**
     * Get the authorizations validated by the user.
     */
    public function validatedAutorisations(): HasMany
    {
        return $this->hasMany(Autorisation::class, 'validated_by');
    }

    /**
     * Get the authorizations marked as read by the user.
     */
    public function readAutorisations(): HasMany
    {
        return $this->hasMany(Autorisation::class, 'read_by');
    }

    /**
     * Get the trainees created by the user.
     */
    public function createdStagiaires(): HasMany
    {
        return $this->hasMany(Stagiaire::class, 'created_by');
    }

    /**
     * Get the trainees last updated by the user.
     */
    public function updatedStagiaires(): HasMany
    {
        return $this->hasMany(Stagiaire::class, 'updated_by');
    }

    /**
     * Get the trainees deleted by the user.
     */
    public function deletedStagiaires(): HasMany
    {
        return $this->hasMany(Stagiaire::class, 'deleted_by');
    }

    /**
     * Get the absences created by the user.
     */
    public function createdAbsences(): HasMany
    {
        return $this->hasMany(Absence::class, 'created_by');
    }

    /**
     * Get the absences last updated by the user.
     */
    public function updatedAbsences(): HasMany
    {
        return $this->hasMany(Absence::class, 'updated_by');
    }

    /**
     * Get the absences deleted by the user.
     */
    public function deletedAbsences(): HasMany
    {
        return $this->hasMany(Absence::class, 'deleted_by');
    }

    /**
     * Get the authorizations created by the user.
     */
    public function createdAutorisations(): HasMany
    {
        return $this->hasMany(Autorisation::class, 'created_by');
    }

    /**
     * Get the authorizations last updated by the user.
     */
    public function updatedAutorisations(): HasMany
    {
        return $this->hasMany(Autorisation::class, 'updated_by');
    }

    /**
     * Get the authorizations deleted by the user.
     */
    public function deletedAutorisations(): HasMany
    {
        return $this->hasMany(Autorisation::class, 'deleted_by');
    }
}
