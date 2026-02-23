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
        // Main prospectus table - stores prospectus metadata
        Schema::create('curriculum_prospectuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('name'); // e.g., "2018-2019 Prospectus"
            $table->string('academic_year'); // e.g., "2018-2019"
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Each course can only have one prospectus per academic year
            $table->unique(['course_id', 'academic_year']);
        });

        // Pivot table - links subjects to prospectus with year level and semester
        Schema::create('curriculum_prospectus_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curriculum_prospectus_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->enum('year_level', ['1st', '2nd', '3rd', '4th', '5th']);
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->integer('sort_order')->default(0); // For ordering subjects within a semester
            $table->timestamps();

            // Each subject can only appear once per year level and semester in a prospectus
            $table->unique(
                ['curriculum_prospectus_id', 'subject_id', 'year_level', 'semester'],
                'prospectus_subject_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curriculum_prospectus_subjects');
        Schema::dropIfExists('curriculum_prospectuses');
    }
};
