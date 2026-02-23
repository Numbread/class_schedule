<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This table links subjects that have the same content but different codes
     * across different curriculum years/programs.
     *
     * Example: CSC 4 (BSIT 2024-2025) and CSP 10 (BSCS 2018-2019) both teach
     * "CISCO 4: WAN Solutions" and can be taught as a parallel/combined class.
     */
    public function up(): void
    {
        Schema::create('subject_equivalents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('equivalent_subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->text('notes')->nullable(); // Optional notes about why they're equivalent
            $table->boolean('is_approved')->default(true); // Require admin approval
            $table->timestamps();

            // Ensure unique pairs (avoid duplicates in either direction)
            $table->unique(['subject_id', 'equivalent_subject_id', 'department_id'], 'subject_equiv_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_equivalents');
    }
};
