// Sentry no React (CAD-096). Só liga com VITE_SENTRY_DSN. Sem PII: apenas o ID do usuário e do escritório.
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

export function initMonitoring() {
    if (!dsn) return;
    Sentry.init({
        dsn,
        environment: import.meta.env.VITE_APP_ENV || 'development',
        release: import.meta.env.VITE_APP_VERSION || undefined, // mesmo valor do back (SHA do commit)
        sendDefaultPii: false,
        tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
        // Nunca enviar o corpo/URL com tokens: remove query/fragmento e cabeçalhos sensíveis
        beforeSend(event) {
            if (event.request?.url) event.request.url = event.request.url.split(/[?#]/)[0];
            if (event.request?.headers) delete event.request.headers.Authorization;
            return event;
        },
    });
}

// Chamado quando o usuário carrega/zera: só IDs, nunca e-mail/nome (LGPD)
export function setMonitoringUser(user) {
    if (!dsn) return;
    if (!user) { Sentry.setUser(null); Sentry.setTag('organization_id', undefined); return; }
    Sentry.setUser({ id: String(user.id) });
    if (user.organization?.id) Sentry.setTag('organization_id', user.organization.id);
}

export const ErrorBoundary = Sentry.ErrorBoundary;
