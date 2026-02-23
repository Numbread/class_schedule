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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->string('code')->unique(); // e.g., BSCS, BSIT
            $table->string('name'); // e.g., Bachelor of Science in Computer Science
            $table->text('description')->nullable();
            $table->integer('years')->default(4); // Program duration
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Majors/Specializations table
        Schema::create('course_majors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('code')->nullable(); // e.g., SE, DS
            $table->string('name'); // e.g., Software Engineering, Data Science
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['course_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_majors');
        Schema::dropIfExists('courses');
    }
};

