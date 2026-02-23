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
        Schema::table('schedule_entries', function (Blueprint $table) {
            // Custom time fields for sessions that don't use the full time slot
            // e.g., a 1-hour lecture in a 1.5-hour slot shows 8:00-9:00 instead of 8:00-9:30
            $table->time('custom_start_time')->nullable()->after('day');
            $table->time('custom_end_time')->nullable()->after('custom_start_time');
            
            // Link paired entries together (e.g., Monday and Wednesday entries for same session)
            // This helps identify that CSIT401 on Monday and CSIT401 on Wednesday are the same session
            $table->uuid('session_group_id')->nullable()->after('custom_end_time');
            
            // Add index for efficient grouping
            $table->index('session_group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedule_entries', function (Blueprint $table) {
            $table->dropIndex(['session_group_id']);
            $table->dropColumn(['custom_start_time', 'custom_end_time', 'session_group_id']);
        });
    }
};
