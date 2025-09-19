<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('calibration_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('calibration_report_id'); // ensure same type as parent
            $table->string('function_tested')->nullable();
            $table->string('nominal')->nullable();
            $table->string('tolerance')->nullable();
            $table->string('unit_under_test')->nullable();
            $table->string('standard_instrument')->nullable();
            $table->string('disparity')->nullable();
            $table->string('correction')->nullable();
            $table->string('remarks')->nullable();
            $table->timestamps();

            $table->foreign('calibration_report_id')
                ->references('id')
                ->on('calibration_report_list')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calibration_details');
    }
};
