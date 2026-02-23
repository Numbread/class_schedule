import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Toaster } from './components/ui/sonner';
import { initializeTheme } from './hooks/use-appearance';

// Configure axios with CSRF token if needed (though we prefer fetch/Inertia)
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Handle Inertia-specific errors (including 419 CSRF token expiration)
router.on('invalid', (event) => {
    const status = event.detail.response?.status;

    // Handle 419 CSRF token expired - reload to get fresh token
    if (status === 419) {
        event.preventDefault();
        window.location.reload();
        return;
    }
});

// Handle unexpected errors (like network issues or server errors)
router.on('exception', (event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exception = event.detail.exception as any;
    const status = exception?.response?.status;

    // Handle 419 CSRF token expired
    if (status === 419) {
        event.preventDefault();
        window.location.reload();
        return;
    }
});

// Handle 419 CSRF token expiration errors
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 419) {
            // CSRF token expired - automatically refresh the page to get a new token
            // This prevents the "419 PAGE EXPIRED" error from showing
            window.location.reload();
            return Promise.resolve({ data: {} }); // Return a resolved promise to prevent further error handling
        }
        return Promise.reject(error);
    }
);

// Handle 419 errors globally (for Inertia and other requests)
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.response?.status === 419 || event.reason?.status === 419) {
        event.preventDefault();
        window.location.reload();
    }
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
                <Toaster />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
