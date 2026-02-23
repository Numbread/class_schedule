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
        // Create buildings table
        Schema::create('buildings', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique(); // e.g., HTF, LIB, MAIN
            $table->string('name'); // e.g., "HTF Building", "Library Building"
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add building_id to rooms
        Schema::table('rooms', function (Blueprint $table) {
            $table->foreignId('building_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        // Create pivot table for academic_setup and buildings
        Schema::create('academic_setup_building', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_setup_id')->constrained()->cascadeOnDelete();
            $table->foreignId('building_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            
            $table->unique(['academic_setup_id', 'building_id']);
        });

        // Create pivot table for academic_setup and rooms (specific room selection)
        Schema::create('academic_setup_room', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_setup_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            
            $table->unique(['academic_setup_id', 'room_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic_setup_room');
        Schema::dropIfExists('academic_setup_building');
        
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropForeign(['building_id']);
            $table->dropColumn('building_id');
        });
        
        Schema::dropIfExists('buildings');
    }
};
