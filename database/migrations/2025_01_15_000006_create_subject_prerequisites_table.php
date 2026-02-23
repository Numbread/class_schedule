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
        Schema::create('subject_prerequisites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('prerequisite_id')->constrained('subjects')->onDelete('cascade');
            $table->string('requirement_type')->default('required'); // required, recommended, corequisite
            $table->timestamps();

            $table->unique(['subject_id', 'prerequisite_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_prerequisites');
    }
};

