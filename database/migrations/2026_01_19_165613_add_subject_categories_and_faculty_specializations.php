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
        // Add category to subjects for room assignment rules
        if (!Schema::hasColumn('subjects', 'category')) {
            Schema::table('subjects', function (Blueprint $table) {
                $table->string('category')->nullable()->after('units');
                // Categories: CISCO, BSCS_PURE, LICT, GENERAL, etc.
            });
        }

        // Add specialization to users (faculty)
        if (!Schema::hasColumn('users', 'specialization')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('specialization')->nullable()->after('user_type');
                // Specializations: CCAI, CS, CPE, IT, etc.
            });
        }

        // Room assignment rules table
        Schema::create('room_assignment_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('subject_category')->nullable(); // Which subject categories this applies to
            $table->string('faculty_specialization')->nullable(); // Which faculty specializations can teach
            $table->json('allowed_room_ids')->nullable(); // Specific rooms allowed
            $table->json('priority_room_ids')->nullable(); // Priority rooms (will be tried first)
            $table->integer('priority')->default(0); // Higher = checked first
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Room priority for certain courses (e.g., BSCS small classes -> HF301, HF203)
        Schema::create('course_room_priorities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->integer('priority')->default(0); // Higher = more preferred
            $table->integer('max_students')->nullable(); // Only apply if class size <= this
            $table->string('room_type')->nullable(); // Apply for specific room types (lecture/lab)
            $table->timestamps();

            $table->unique(['course_id', 'room_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_room_priorities');
        Schema::dropIfExists('room_assignment_rules');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('specialization');
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
