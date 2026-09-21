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
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('check_in_ip')->nullable()->after('check_out_longitude');
            $table->string('check_out_ip')->nullable()->after('check_in_ip');
            $table->boolean('fraud_flag')->default(false)->after('check_out_ip');
            $table->text('fraud_reason')->nullable()->after('fraud_flag');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn([
                'check_in_ip',
                'check_out_ip',
                'fraud_flag',
                'fraud_reason',
            ]);
        });
    }
};
