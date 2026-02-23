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
        Schema::create('schedule_change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->comment('Requester (Faculty)');
            $table->foreignId('target_time_slot_id')->constrained('time_slots');
            $table->foreignId('target_room_id')->constrained('rooms');
            $table->string('target_day'); // lowercase: monday, tuesday...
            $table->string('status')->default('pending')->comment('pending, approved, rejected');
            $table->text('reason')->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_change_requests');
    }
};
