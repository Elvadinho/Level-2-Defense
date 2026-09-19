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
            $table->boolean('is_remote')->default(false)->after('check_out_distance');
            $table->text('remote_reason')->nullable()->after('is_remote');
            $table->string('remote_status')->nullable()->after('remote_reason'); // pending, approved, rejected
            $table->foreignId('remote_approved_by')->nullable()->after('remote_status')
                ->constrained('users')->nullOnDelete();
            $table->text('remote_rejection_reason')->nullable()->after('remote_approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['remote_approved_by']);
            $table->dropColumn([
                'is_remote',
                'remote_reason',
                'remote_status',
                'remote_approved_by',
                'remote_rejection_reason',
            ]);
        });
    }
};
