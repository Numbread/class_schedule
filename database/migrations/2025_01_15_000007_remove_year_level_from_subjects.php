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
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('year_level');
        });

        // Drop the subject_semesters table as semester assignment will be dynamic
        Schema::dropIfExists('subject_semesters');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->enum('year_level', ['1st', '2nd', '3rd', '4th', '5th'])->default('1st')->after('lab_hours');
        });

        // Recreate subject_semesters table
        Schema::create('subject_semesters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->string('academic_year');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->unique(['subject_id', 'semester', 'academic_year']);
        });
    }
};

