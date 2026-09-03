<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agent_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('user_input');
            $table->text('prompt');
            $table->string('intent')->nullable();
            $table->json('llm_response')->nullable();
            $table->json('parsed_action')->nullable();
            $table->string('status')->default('pending');
            $table->text('result')->nullable();
            $table->text('error_log')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_requests');
    }
};