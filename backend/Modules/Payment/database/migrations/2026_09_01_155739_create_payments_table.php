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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');

            // NotchPay fields
            $table->string('notchpay_reference')->unique()->nullable(); // Reference from NotchPay
            $table->string('notchpay_trx_ref')->nullable(); // Transaction reference from NotchPay
            $table->decimal('amount', 15, 2);
            $table->string('currency')->default('XAF');
            $table->string('channel')->nullable(); // 'cm.mtn', 'cm.orange', 'cm.card'
            $table->string('phone')->nullable(); // Customer's phone number
            $table->enum('status', ['pending', 'processing', 'complete', 'failed', 'cancelled'])->default('pending');
            $table->text('failure_reason')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
