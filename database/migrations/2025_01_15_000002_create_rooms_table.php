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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('building')->nullable();
            $table->string('floor')->nullable();
            $table->enum('room_type', ['lecture', 'laboratory', 'hybrid'])->default('lecture');
            $table->integer('capacity')->default(30);
            $table->integer('priority')->default(1);
            $table->json('equipment')->nullable();
            $table->json('class_settings')->nullable();
            $table->boolean('is_available')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['name', 'building']);
        });

        Schema::create('room_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->onDelete('cascade');
            $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_schedules');
        Schema::dropIfExists('rooms');
    }
};

