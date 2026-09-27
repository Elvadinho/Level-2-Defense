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
        Schema::create('task_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete(); // The task that depends on another
            $table->foreignId('depends_on_task_id')->constrained('tasks')->cascadeOnDelete(); // The task it depends on
            $table->string('dependency_type')->default('finish_to_start'); // finish_to_start, start_to_start, etc.
            $table->timestamps();
            
            // Prevent duplicate dependencies
            $table->unique(['task_id', 'depends_on_task_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_dependencies');
    }
};
