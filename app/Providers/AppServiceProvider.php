<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {

        Vite::prefetch(concurrency: 3);
        $server_ip = $_SERVER['SERVER_ADDR'] ?? '127.0.0.1';

        $url = match ($server_ip) {
            '172.16.5.181', '192.168.3.201' => env('APP_URL', 'http://machine-portal:88/pmesked'),
            default => env('APP_BASE_URL', 'http://192.168.3.201:88/pmesked'),
        };



        config(['app.url' => $url]);
    }
}
