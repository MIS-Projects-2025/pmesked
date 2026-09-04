import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import animate from 'tailwindcss-animate';
import daisyui from 'daisyui';

/**
 * Tailwind v3 config with shadcn/ui tokens.
 * Colours are read from CSS variables in resources/css/app.css and support
 * opacity modifiers (e.g. bg-muted/40) through <alpha-value>.
 */
const token = (name) => `oklch(from var(--${name}) l c h / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './resources/js/**/*.js',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Poppins', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                border: token('border'),
                input: token('input'),
                ring: token('ring'),
                background: token('background'),
                foreground: token('foreground'),
                primary: {
                    DEFAULT: token('primary'),
                    foreground: token('primary-foreground'),
                },
                secondary: {
                    DEFAULT: token('secondary'),
                    foreground: token('secondary-foreground'),
                },
                destructive: {
                    DEFAULT: token('destructive'),
                    foreground: token('destructive-foreground'),
                },
                muted: {
                    DEFAULT: token('muted'),
                    foreground: token('muted-foreground'),
                },
                accent: {
                    DEFAULT: token('accent'),
                    foreground: token('accent-foreground'),
                },
                popover: {
                    DEFAULT: token('popover'),
                    foreground: token('popover-foreground'),
                },
                card: {
                    DEFAULT: token('card'),
                    foreground: token('card-foreground'),
                },
                chart: {
                    1: 'var(--chart-1)',
                    2: 'var(--chart-2)',
                    3: 'var(--chart-3)',
                    4: 'var(--chart-4)',
                    5: 'var(--chart-5)',
                },
                sidebar: {
                    DEFAULT: token('sidebar'),
                    foreground: token('sidebar-foreground'),
                    primary: token('sidebar-primary'),
                    'primary-foreground': token('sidebar-primary-foreground'),
                    accent: token('sidebar-accent'),
                    'accent-foreground': token('sidebar-accent-foreground'),
                    border: token('sidebar-border'),
                    ring: token('sidebar-ring'),
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                fade: {
                    '0%, 100%': { opacity: '0' },
                    '50%': { opacity: '1' },
                },
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
            },
            animation: {
                fade: 'fade 2s ease-in-out infinite',
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },

    plugins: [forms, animate, daisyui],
    daisyui: {
        themes: ['light', 'dark'],
    },
};
