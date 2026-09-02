<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('uuid', 36)->nullable()->unique()->after('id');
        });

        // Populate existing rows with uuids
        $notifications = DB::table('notifications')->select('id')->get();
        foreach ($notifications as $n) {
            DB::table('notifications')->where('id', $n->id)->update(['uuid' => (string) Str::uuid()]);
        }
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });
    }
};
