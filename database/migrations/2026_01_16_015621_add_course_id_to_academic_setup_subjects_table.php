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
        Schema::table('academic_setup_subjects', function (Blueprint $table) {
            // Add course_id to allow course-specific blocks for shared/GE subjects
            $table->foreignId('course_id')->nullable()->after('subject_id')->constrained()->onDelete('cascade');
            
            // Add index for efficient querying
            $table->index(['year_level_id', 'subject_id', 'course_id', 'block_number'], 'subject_course_block_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_setup_subjects', function (Blueprint $table) {
            $table->dropIndex('subject_course_block_idx');
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });
    }
};
