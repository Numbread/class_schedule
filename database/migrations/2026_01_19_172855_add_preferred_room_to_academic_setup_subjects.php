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
        Schema::table('academic_setup_subjects', function (Blueprint $table) {
            // Preferred room for lecture
            $table->foreignId('preferred_lecture_room_id')
                ->nullable()
                ->after('needs_lab')
                ->constrained('rooms')
                ->nullOnDelete();
            
            // Preferred room for lab (if subject has lab hours)
            $table->foreignId('preferred_lab_room_id')
                ->nullable()
                ->after('preferred_lecture_room_id')
                ->constrained('rooms')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_setup_subjects', function (Blueprint $table) {
            $table->dropForeign(['preferred_lecture_room_id']);
            $table->dropForeign(['preferred_lab_room_id']);
            $table->dropColumn(['preferred_lecture_room_id', 'preferred_lab_room_id']);
        });
    }
};
