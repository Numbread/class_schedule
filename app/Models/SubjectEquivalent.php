<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubjectEquivalent extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'equivalent_subject_id',
        'department_id',
        'notes',
        'is_approved',
    ];

    protected function casts(): array
    {
        return [
            'is_approved' => 'boolean',
        ];
    }

    /**
     * Get the primary subject.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    /**
     * Get the equivalent subject.
     */
    public function equivalentSubject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'equivalent_subject_id');
    }

    /**
     * Get the department this equivalence belongs to.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Scope to get approved equivalents only.
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope to get equivalents for a specific department.
     */
    public function scopeForDepartment($query, int $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    /**
     * Find all equivalent subjects for a given subject ID within a department.
     */
    public static function getEquivalentsFor(int $subjectId, int $departmentId): array
    {
        $equivalents = [];

        // Get where this subject is the primary
        $asPrimary = static::approved()
            ->forDepartment($departmentId)
            ->where('subject_id', $subjectId)
            ->with('equivalentSubject')
            ->get();

        foreach ($asPrimary as $equiv) {
            $equivalents[] = $equiv->equivalentSubject;
        }

        // Get where this subject is the equivalent
        $asEquivalent = static::approved()
            ->forDepartment($departmentId)
            ->where('equivalent_subject_id', $subjectId)
            ->with('subject')
            ->get();

        foreach ($asEquivalent as $equiv) {
            $equivalents[] = $equiv->subject;
        }

        return $equivalents;
    }

    /**
     * Check if two subjects are equivalent.
     */
    public static function areEquivalent(int $subjectId1, int $subjectId2, int $departmentId): bool
    {
        return static::approved()
            ->forDepartment($departmentId)
            ->where(function ($query) use ($subjectId1, $subjectId2) {
                $query->where(function ($q) use ($subjectId1, $subjectId2) {
                    $q->where('subject_id', $subjectId1)
                      ->where('equivalent_subject_id', $subjectId2);
                })->orWhere(function ($q) use ($subjectId1, $subjectId2) {
                    $q->where('subject_id', $subjectId2)
                      ->where('equivalent_subject_id', $subjectId1);
                });
            })
            ->exists();
    }

    /**
     * Create a bidirectional equivalence (creates both directions).
     */
    public static function createEquivalence(
        int $subjectId1,
        int $subjectId2,
        int $departmentId,
        ?string $notes = null,
        bool $approved = false
    ): self {
        // Check if equivalence already exists
        if (static::areEquivalent($subjectId1, $subjectId2, $departmentId)) {
            return static::where(function ($query) use ($subjectId1, $subjectId2) {
                $query->where(function ($q) use ($subjectId1, $subjectId2) {
                    $q->where('subject_id', $subjectId1)
                      ->where('equivalent_subject_id', $subjectId2);
                })->orWhere(function ($q) use ($subjectId1, $subjectId2) {
                    $q->where('subject_id', $subjectId2)
                      ->where('equivalent_subject_id', $subjectId1);
                });
            })->forDepartment($departmentId)->first();
        }

        // Store in one direction only (smaller ID first for consistency)
        $primary = min($subjectId1, $subjectId2);
        $equivalent = max($subjectId1, $subjectId2);

        return static::create([
            'subject_id' => $primary,
            'equivalent_subject_id' => $equivalent,
            'department_id' => $departmentId,
            'notes' => $notes,
            'is_approved' => $approved,
        ]);
    }
}
