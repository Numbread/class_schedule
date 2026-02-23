<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Academic Setup - Main setup record (covers entire semester, all year levels)
        Schema::create('academic_setups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('curriculum_name'); // e.g., "BSIT Curriculum 2024"
            $table->string('academic_year'); // e.g., "2025-2026"
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->boolean('is_active')->default(true);
            $table->enum('status', ['draft', 'configuring', 'active', 'archived'])->default('draft');
            $table->integer('current_config_year')->nullable(); // Track which year is being configured (1-5)
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['course_id', 'academic_year', 'semester'], 'academic_setup_unique');
        });

        // Year levels within an academic setup
        Schema::create('academic_setup_year_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_setup_id')->constrained()->onDelete('cascade');
            $table->enum('year_level', ['1st', '2nd', '3rd', '4th', '5th']);
            $table->integer('section_count')->default(1); // How many sections for this year level
            $table->integer('expected_students')->default(40); // Expected students per section
            $table->boolean('is_configured')->default(false); // Whether subjects/faculty have been assigned
            $table->timestamps();

            $table->unique(['academic_setup_id', 'year_level'], 'setup_year_level_unique');
        });

        // Subjects assigned to a specific year level within an academic setup
        Schema::create('academic_setup_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_setup_id')->constrained()->onDelete('cascade');
            $table->foreignId('year_level_id')->constrained('academic_setup_year_levels')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->integer('expected_students')->default(40);
            $table->boolean('needs_lab')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['year_level_id', 'subject_id'], 'year_level_subject_unique');
        });

        // Faculty assigned to an academic setup (available for all year levels)
        Schema::create('academic_setup_faculty', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_setup_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('max_units')->default(24); // Maximum teaching load
            $table->enum('preferred_day_off', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['academic_setup_id', 'user_id']);
        });

        // Subject-Faculty assignments (which faculty teaches which subject)
        Schema::create('subject_faculty_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_setup_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_setup_subject_id')->constrained('academic_setup_subjects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['academic_setup_subject_id', 'user_id'], 'subject_faculty_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_faculty_assignments');
        Schema::dropIfExists('academic_setup_faculty');
        Schema::dropIfExists('academic_setup_subjects');
        Schema::dropIfExists('academic_setup_year_levels');
        Schema::dropIfExists('academic_setups');
    }
};

