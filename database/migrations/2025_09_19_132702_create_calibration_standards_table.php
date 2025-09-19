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
        Schema::create('calibration_standards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('calibration_report_id'); // ensure same type as parent
            $table->string('description')->nullable();
            $table->string('cal_manufacturer')->nullable();
            $table->string('model_no')->nullable();
            $table->string('cal_control_no')->nullable();
            $table->string('serial_no')->nullable();
            $table->string('accuracy')->nullable();
            $table->date('cal_date')->nullable();
            $table->date('cal_due')->nullable();
            $table->string('traceability')->nullable();
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
        Schema::dropIfExists('calibration_standards');
    }
};
