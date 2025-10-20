import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import './pages/Auth/register';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import { installAxiosCsrf } from './lib/csrf';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationProvider } from './contexts/NotificationContext';
const appName = import.meta.env.VITE_APP_NAME || 'EfficiAdmin';

// Configure axios and CSRF protection globally 
installAxiosCsrf();

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

                    const isAuthenticated = Boolean((props as any)?.initialPage?.props?.auth?.user);
                    root.render(
                        <NotificationProvider isAuthenticated={isAuthenticated}>
                            <App {...props} />
                            <ToastContainer
                                position="top-right"
                                autoClose={3000}
                                hideProgressBar={false}
                                newestOnTop={false}
                                closeOnClick
                                rtl={false}
                                pauseOnFocusLoss
                                draggable
                                pauseOnHover
                                theme="colored"
                                aria-label="Notification"
                            />
                        </NotificationProvider>
                    );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
