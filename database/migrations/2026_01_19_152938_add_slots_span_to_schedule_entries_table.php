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
            // Number of time slots this entry spans (for Friday continuous sessions)
            // 1 = normal single slot, 2+ = spans multiple consecutive slots
            $table->unsignedTinyInteger('slots_span')->default(1)->after('session_group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedule_entries', function (Blueprint $table) {
            $table->dropColumn('slots_span');
        });
    }
};
