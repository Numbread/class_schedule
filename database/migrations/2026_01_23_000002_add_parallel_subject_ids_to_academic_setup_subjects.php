<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This adds support for parallel subjects - subjects with different codes
     * but same content that are taught together (e.g., CSC 4 and CSP 10 both
     * teaching "CISCO 4: WAN Solutions").
     */
    public function up(): void
    {
        Schema::table('academic_setup_subjects', function (Blueprint $table) {
            // JSON array of subject IDs that are taught in parallel with this subject
            // e.g., [1, 5] means subjects with IDs 1 and 5 are combined in this block
            $table->json('parallel_subject_ids')->nullable()->after('preferred_lab_room_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_setup_subjects', function (Blueprint $table) {
            $table->dropColumn('parallel_subject_ids');
        });
    }
};
