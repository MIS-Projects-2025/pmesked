<?php

if (!function_exists('base_url')) {
    function base_url(): string
    {
        $value = config('app.base_url');

        // If config returned a closure, call it
        if ($value instanceof Closure) {
            return $value();
        }

        return $value;
    }
}
