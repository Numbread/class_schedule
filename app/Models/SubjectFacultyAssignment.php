<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubjectFacultyAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_setup_id',
        'academic_setup_subject_id',
        'user_id',
        'is_primary',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    /**
     * Get the academic setup.
     */
    public function academicSetup(): BelongsTo
    {
        return $this->belongsTo(AcademicSetup::class);
    }

    /**
     * Get the academic setup subject.
     */
    public function academicSetupSubject(): BelongsTo
    {
        return $this->belongsTo(AcademicSetupSubject::class, 'academic_setup_subject_id');
    }

    /**
     * Get the faculty user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

