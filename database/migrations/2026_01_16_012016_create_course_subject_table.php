<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('course_subject', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Unique constraint to prevent duplicate entries
            $table->unique(['course_id', 'subject_id']);
        });

        // Migrate existing course_id relationships to the pivot table
        DB::statement("
            INSERT INTO course_subject (course_id, subject_id, created_at, updated_at)
            SELECT course_id, id, NOW(), NOW()
            FROM subjects
            WHERE course_id IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_subject');
    }
};
