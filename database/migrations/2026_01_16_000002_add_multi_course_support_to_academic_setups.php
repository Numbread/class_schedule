<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration adds support for multiple courses per academic setup.
     * Instead of a single course_id, we now have a pivot table academic_setup_courses.
     * This allows a department to create one setup that includes all their courses
     * (e.g., CCS can include BSIT, BSCS, and BLIS in one setup).
     */
    public function up(): void
    {
        // Create pivot table for courses in an academic setup
        Schema::create('academic_setup_courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_setup_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['academic_setup_id', 'course_id']);
        });

        // Migrate existing data: copy course_id to the new pivot table
        $setups = DB::table('academic_setups')->whereNotNull('course_id')->get();
        foreach ($setups as $setup) {
            DB::table('academic_setup_courses')->insert([
                'academic_setup_id' => $setup->id,
                'course_id' => $setup->course_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Make course_id nullable (we'll keep it for backwards compatibility but it's deprecated)
        Schema::table('academic_setups', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore course_id from pivot table (use first course)
        $setupCourses = DB::table('academic_setup_courses')
            ->select('academic_setup_id', DB::raw('MIN(course_id) as course_id'))
            ->groupBy('academic_setup_id')
            ->get();

        foreach ($setupCourses as $sc) {
            DB::table('academic_setups')
                ->where('id', $sc->academic_setup_id)
                ->update(['course_id' => $sc->course_id]);
        }

        Schema::dropIfExists('academic_setup_courses');

        Schema::table('academic_setups', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable(false)->change();
        });
    }
};

