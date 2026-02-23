<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration adds block support to academic setup subjects.
     * A block represents a section/group of students within a year level.
     * For example: 1st Year Block 1, 1st Year Block 2, etc.
     */
    public function up(): void
    {
        // Check if block_number column already exists (from partial migration)
        if (!Schema::hasColumn('academic_setup_subjects', 'block_number')) {
            Schema::table('academic_setup_subjects', function (Blueprint $table) {
                $table->integer('block_number')->default(1)->after('subject_id');
            });
        }

        // For MySQL, we need to handle the unique index carefully
        // First, create a regular index on year_level_id that MySQL can use for the FK
        // Then drop the unique constraint, then add the new one
        
        // Step 1: Add a simple index on year_level_id (MySQL needs this for the FK after we drop the unique)
        try {
            Schema::table('academic_setup_subjects', function (Blueprint $table) {
                $table->index('year_level_id', 'academic_setup_subjects_year_level_id_index');
            });
        } catch (\Exception $e) {
            // Index might already exist
        }

        // Step 2: Drop the old unique constraint using raw SQL (Laravel's dropUnique may not work)
        try {
            DB::statement('ALTER TABLE academic_setup_subjects DROP INDEX year_level_subject_unique');
        } catch (\Exception $e) {
            // Index might not exist or already dropped
        }

        // Step 3: Add new unique constraint including block_number
        try {
            Schema::table('academic_setup_subjects', function (Blueprint $table) {
                $table->unique(['year_level_id', 'subject_id', 'block_number'], 'year_level_subject_block_unique');
            });
        } catch (\Exception $e) {
            // Index might already exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the new unique constraint
        try {
            Schema::table('academic_setup_subjects', function (Blueprint $table) {
                $table->dropUnique('year_level_subject_block_unique');
            });
        } catch (\Exception $e) {
            // Ignore
        }

        // Drop the helper index
        try {
            Schema::table('academic_setup_subjects', function (Blueprint $table) {
                $table->dropIndex('academic_setup_subjects_year_level_id_index');
            });
        } catch (\Exception $e) {
            // Ignore
        }

        // Restore original unique constraint
        try {
            Schema::table('academic_setup_subjects', function (Blueprint $table) {
                $table->unique(['year_level_id', 'subject_id'], 'year_level_subject_unique');
            });
        } catch (\Exception $e) {
            // Ignore
        }

        // Drop the block_number column
        if (Schema::hasColumn('academic_setup_subjects', 'block_number')) {
            Schema::table('academic_setup_subjects', function (Blueprint $table) {
                $table->dropColumn('block_number');
            });
        }
    }
};
