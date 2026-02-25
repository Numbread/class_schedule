<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('academic_setup_faculty', function (Blueprint $table) {
            $table->string('preferred_day_off_time')->nullable()->after('preferred_day_off')->comment('morning, afternoon, or wholeday');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_setup_faculty', function (Blueprint $table) {
            $table->dropColumn('preferred_day_off_time');
        });
    }
};
