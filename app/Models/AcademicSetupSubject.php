<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicSetupSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_setup_id',
        'year_level_id', // Reference to specific year level
        'subject_id',
        'course_id', // Course this block belongs to (for shared/GE subjects)
        'block_number', // Block/section number (1, 2, 3, etc.)
        'expected_students',
        'needs_lab',
        'preferred_lecture_room_id',
        'preferred_lab_room_id',
        'parallel_subject_ids', // IDs of subjects taught in parallel (different codes, same content)
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'block_number' => 'integer',
            'expected_students' => 'integer',
            'needs_lab' => 'boolean',
            'is_active' => 'boolean',
            'parallel_subject_ids' => 'array',
        ];
    }

    protected $appends = ['block_code', 'display_code', 'course_group_code', 'parallel_display_code'];

    /**
     * Get the academic setup (for backwards compatibility).
     */
    public function academicSetup(): BelongsTo
    {
        return $this->belongsTo(AcademicSetup::class);
    }

    /**
     * Get the year level this subject belongs to.
     */
    public function yearLevel(): BelongsTo
    {
        return $this->belongsTo(AcademicSetupYearLevel::class, 'year_level_id');
    }

    /**
     * Get the subject.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Get the course this block belongs to (for shared/GE subjects).
     * @deprecated Use courses() relationship instead for fused course support.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the preferred lecture room for this subject.
     */
    public function preferredLectureRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'preferred_lecture_room_id');
    }

    /**
     * Get the preferred lab room for this subject.
     */
    public function preferredLabRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'preferred_lab_room_id');
    }

    /**
     * Get all courses this block belongs to (supports fused/combined courses).
     * When multiple courses are assigned, students from those courses are combined in this block.
     */
    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(
            Course::class,
            'academic_setup_subject_courses',
            'academic_setup_subject_id',
            'course_id'
        );
    }

    /**
     * Get the faculty assignments for this subject.
     */
    public function facultyAssignments(): HasMany
    {
        return $this->hasMany(SubjectFacultyAssignment::class, 'academic_setup_subject_id');
    }

    /**
     * Get the schedule entries for this subject.
     */
    public function scheduleEntries(): HasMany
    {
        return $this->hasMany(ScheduleEntry::class, 'academic_setup_subject_id');
    }

    /**
     * Scope to get active subjects.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the block code suffix (e.g., "01", "02").
     * Block number is padded to 2 digits regardless of year level.
     */
    public function getBlockCodeAttribute(): string
    {
        return str_pad($this->block_number, 2, '0', STR_PAD_LEFT);
    }

    /**
     * Get the course group code for fused courses.
     * Combines course codes into a short identifier (e.g., "CS" for BSCS+BSIT, "IS" for BLIS).
     */
    public function getCourseGroupCodeAttribute(): string
    {
        // Use the new courses relationship if available
        $courses = $this->courses;

        if ($courses->isEmpty()) {
            // Fallback to single course_id for backwards compatibility
            if ($this->course) {
                return $this->extractCourseGroupCode($this->course->code);
            }
            return '';
        }

        if ($courses->count() === 1) {
            return $this->extractCourseGroupCode($courses->first()->code);
        }

        // For multiple fused courses, combine their group codes
        // e.g., BSCS + BSIT = "CS" (they share the same suffix)
        // If different: BSCS + BLIS = "CS+IS"
        $groupCodes = $courses->map(fn($c) => $this->extractCourseGroupCode($c->code))->unique()->sort();
        return $groupCodes->implode('+');
    }

    /**
     * Extract the course group code from a course code.
     * e.g., "BSCS" -> "CS", "BSIT" -> "IT", "BLIS" -> "IS"
     */
    private function extractCourseGroupCode(string $courseCode): string
    {
        // Remove common prefixes like "BS", "BA", "B"
        $code = preg_replace('/^(BS|BA|B)/', '', strtoupper($courseCode));
        return $code ?: $courseCode;
    }

    /**
     * Get the display code with block suffix.
     * - Course-specific subjects: [Subject Code][Block Code] (e.g., "CSC401")
     * - Fused blocks (multiple courses): [Subject Code][Block Code] (e.g., "CSIT101") - no course suffix
     * - Separate blocks (single course): [Subject Code][Course Group][Block Code] (e.g., "CSIT1CS01")
     */
    public function getDisplayCodeAttribute(): string
    {
        if (!$this->subject) {
            return '';
        }

        // Remove spaces from subject code
        $baseCode = str_replace(' ', '', $this->subject->code);

        // Check if this is a shared subject (no course_id OR belongs to multiple courses)
        $isSharedSubject = is_null($this->subject->course_id) ||
            ($this->subject->courses && $this->subject->courses->count() > 1);

        // Only add course suffix for SEPARATE blocks (single course) of shared subjects
        // Fused blocks (multiple courses) don't need the suffix since all students are combined
        $blockCourses = $this->courses;
        $isSeparateBlock = $blockCourses->count() === 1;

        if ($isSharedSubject && $isSeparateBlock) {
            // For separate blocks: [SubjectCode][CourseGroup][BlockCode]
            // e.g., CSIT1 + CS + 01 = CSIT1CS01
            $courseGroupCode = $this->course_group_code;
            if ($courseGroupCode) {
                return $baseCode . $courseGroupCode . $this->block_code;
            }
        }

        // For fused blocks or course-specific subjects: [SubjectCode][BlockCode]
        return $baseCode . $this->block_code;
    }

    /**
     * Get a descriptive name including block.
     */
    public function getBlockDisplayNameAttribute(): string
    {
        return "Block {$this->block_number}";
    }

    /**
     * Scope to get subjects for a specific block.
     */
    public function scopeForBlock($query, int $blockNumber)
    {
        return $query->where('block_number', $blockNumber);
    }

    /**
     * Check if this block has parallel subjects (different codes, same content).
     */
    public function hasParallelSubjects(): bool
    {
        return !empty($this->parallel_subject_ids) && count($this->parallel_subject_ids) > 1;
    }

    /**
     * Get the display code for parallel subjects (e.g., "CSC401/CSP1001").
     * Returns empty string if not a parallel subject block.
     */
    public function getParallelDisplayCodeAttribute(): string
    {
        if (!$this->hasParallelSubjects()) {
            return '';
        }

        $codes = [];
        foreach ($this->parallel_subject_ids as $subjectId) {
            $subject = Subject::find($subjectId);
            if ($subject) {
                $baseCode = str_replace(' ', '', $subject->code);
                $codes[] = $baseCode . $this->block_code;
            }
        }

        return implode('/', $codes);
    }

    /**
     * Get all parallel subjects as models.
     */
    public function getParallelSubjects(): \Illuminate\Support\Collection
    {
        if (!$this->hasParallelSubjects()) {
            return collect();
        }

        return Subject::whereIn('id', $this->parallel_subject_ids)->get();
    }

    /**
     * Get the common descriptive title for parallel subjects.
     * Finds the common part of the subject names.
     */
    public function getParallelDescriptiveTitleAttribute(): string
    {
        if (!$this->hasParallelSubjects()) {
            return $this->subject?->name ?? '';
        }

        $subjects = $this->getParallelSubjects();
        if ($subjects->isEmpty()) {
            return $this->subject?->name ?? '';
        }

        // Try to find common substring in all subject names
        $names = $subjects->pluck('name')->toArray();

        // Look for content in parentheses that matches across all names
        $commonPhrases = [];
        foreach ($names as $name) {
            if (preg_match('/\(([^)]+)\)/', $name, $matches)) {
                $commonPhrases[] = $matches[1];
            }
        }

        // Check if all parenthetical content matches
        $uniquePhrases = array_unique($commonPhrases);
        if (count($uniquePhrases) === 1 && count($commonPhrases) === count($names)) {
            return $uniquePhrases[0];
        }

        // Fallback: return the first subject's name
        return $this->subject?->name ?? '';
    }
}
