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
            $table->foreignId('course_id')->nullable()->after('id')->constrained()->onDelete('set null');
            $table->foreignId('major_id')->nullable()->after('course_id')->constrained('course_majors')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropForeign(['major_id']);
            $table->dropColumn(['course_id', 'major_id']);
        });
    }
};

