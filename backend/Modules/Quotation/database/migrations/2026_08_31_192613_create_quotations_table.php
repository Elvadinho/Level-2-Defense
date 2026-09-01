<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');

            // IT Project Specific Fields
            $table->string('project_name');
            $table->string('project_type'); // e.g., 'Web Development', 'AI Automation', 'UI/UX Design'
            $table->json('technology_stack')->nullable(); // e.g., ['React', 'Laravel', 'Python']
            $table->string('estimated_duration')->nullable(); // e.g., '4 Weeks', '3 Months'

            // Standard Quotation Fields
            $table->date('quotation_date');
            $table->date('valid_until');
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('status', ['draft', 'sent', 'accepted', 'rejected'])->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
