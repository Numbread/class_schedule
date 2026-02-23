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
        Schema::table('subject_faculty_assignments', function (Blueprint $table) {
            // Make user_id nullable to allow subjects without assigned faculty (TBA)
            $table->foreignId('user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subject_faculty_assignments', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};
