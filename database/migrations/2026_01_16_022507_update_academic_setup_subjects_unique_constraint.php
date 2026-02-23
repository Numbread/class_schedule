<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Update the unique constraint to include course_id.
     * This allows the same subject with the same block number to exist for different courses.
     * For example: OC1 Block 1 for BSCS+BSIT (fused) and OC1 Block 1 for BLIS (separate).
     */
    public function up(): void
    {
        Schema::table('academic_setup_subjects', function (Blueprint $table) {
            // Drop the old unique constraint
            $table->dropUnique('year_level_subject_block_unique');
            
            // Add new unique constraint that includes course_id
            // This allows same subject+block but for different course combinations
            $table->unique(
                ['year_level_id', 'subject_id', 'course_id', 'block_number'], 
                'year_level_subject_course_block_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_setup_subjects', function (Blueprint $table) {
            // Drop the new constraint
            $table->dropUnique('year_level_subject_course_block_unique');
            
            // Restore old constraint (note: this may fail if there are duplicate entries without course_id)
            $table->unique(
                ['year_level_id', 'subject_id', 'block_number'], 
                'year_level_subject_block_unique'
            );
        });
    }
};
