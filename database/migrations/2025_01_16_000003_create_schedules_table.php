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
        // Generated schedules
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_setup_id')->constrained()->onDelete('cascade');
            $table->string('name'); // e.g., "Schedule v1 - Generated 2025-01-16"
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->integer('fitness_score')->nullable(); // Genetic algorithm fitness
            $table->integer('generation')->nullable(); // Which GA generation produced this
            $table->json('metadata')->nullable(); // Store generation stats
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        // Individual schedule entries (room allocations)
        Schema::create('schedule_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_setup_subject_id')->constrained('academic_setup_subjects')->onDelete('cascade');
            $table->foreignId('room_id')->constrained()->onDelete('cascade');
            $table->foreignId('time_slot_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Assigned faculty
            $table->enum('day', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
            $table->boolean('is_lab_session')->default(false);
            $table->timestamps();

            // Prevent double booking of room at same time
            $table->unique(['schedule_id', 'room_id', 'time_slot_id', 'day'], 'unique_room_booking');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_entries');
        Schema::dropIfExists('schedules');
    }
};

