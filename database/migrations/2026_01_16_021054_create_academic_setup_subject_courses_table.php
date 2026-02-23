<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This pivot table allows an academic_setup_subject (a block) to belong to
     * multiple courses. This enables "fusing" courses together - e.g., BSCS and BSIT
     * students can be combined in the same block while BLIS is separate.
     */
    public function up(): void
    {
        Schema::create('academic_setup_subject_courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_setup_subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            // Unique constraint to prevent duplicate course assignments
            $table->unique(['academic_setup_subject_id', 'course_id'], 'setup_subject_course_unique');
        });

        // We'll keep the course_id column on academic_setup_subjects for backwards compatibility
        // but the new courses relationship via pivot table will be the primary way to get courses
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic_setup_subject_courses');
    }
};
