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
        Schema::table('academic_setup_faculty', function (Blueprint $table) {
            $table->enum('preferred_time_period', ['morning', 'afternoon'])->nullable()->after('preferred_day_off');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_setup_faculty', function (Blueprint $table) {
            $table->dropColumn('preferred_time_period');
        });
    }
};
