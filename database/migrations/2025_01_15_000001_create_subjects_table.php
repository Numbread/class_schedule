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
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('units')->default(3);
            $table->integer('lecture_hours')->default(3);
            $table->integer('lab_hours')->default(0);
            $table->enum('year_level', ['1st', '2nd', '3rd', '4th', '5th'])->default('1st');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_semesters');
        Schema::dropIfExists('subjects');
    }
};

