<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');

            $table->string('service_category'); // e.g., 'Hosting', 'Development', 'Consulting'
            $table->string('description');

            $table->integer('quantity');
            $table->string('unit')->default('Flat Rate');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('subtotal', 15, 2); // quantity * unit_price

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
