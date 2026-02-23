<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Building extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the rooms in this building.
     */
    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    /**
     * Get the academic setups that use this building.
     */
    public function academicSetups(): BelongsToMany
    {
        return $this->belongsToMany(AcademicSetup::class, 'academic_setup_building')
            ->withTimestamps();
    }

    /**
     * Scope to get only active buildings.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get full name with code.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->code} - {$this->name}";
    }
}
