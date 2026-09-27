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
        Schema::table('task_comments', function (Blueprint $table) {
            $table->boolean('is_edited')->default(false)->after('body');
            $table->timestamp('edited_at')->nullable()->after('is_edited');
            $table->json('reactions')->nullable()->after('edited_at'); // Store reactions as JSON {like: 5, helpful: 2, resolved: 1}
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_comments', function (Blueprint $table) {
            $table->dropColumn(['is_edited', 'edited_at', 'reactions']);
        });
    }
};
