// Gestão Cadrius (TI e Financeiro) — CAD-168. Contrato: backoffice/api.py no back (/api/v1/backoffice/)
import api from './api';

const BASE = 'backoffice/';

export const backofficeApi = {
    me: () => api.get(`${BASE}me/`).then((r) => r.data),
    overview: () => api.get(`${BASE}overview/`).then((r) => r.data),
    health: () => api.get(`${BASE}health/`).then((r) => r.data),
    organizations: (params) => api.get(`${BASE}organizations/`, { params }).then((r) => r.data),
    organization: (id) => api.get(`${BASE}organizations/${id}/`).then((r) => r.data),
    orgAction: (id, body) => api.post(`${BASE}organizations/${id}/actions/`, body).then((r) => r.data),
    users: (params) => api.get(`${BASE}users/`, { params }).then((r) => r.data),
    userAction: (id, body) => api.post(`${BASE}users/${id}/actions/`, body).then((r) => r.data),
    aiSwitch: (body) => api.post(`${BASE}ai-switch/`, body).then((r) => r.data),
};

export const AREA_LABEL = { ti: 'TI', financeiro: 'Financeiro' };

export const SUB_STATE = {
    trialing: { label: 'Em teste', tone: 'blue' }, active: { label: 'Ativa', tone: 'green' },
    past_due: { label: 'Pagamento pendente', tone: 'yellow' }, restricted: { label: 'Restrita', tone: 'orange' },
    suspended: { label: 'Suspensa', tone: 'red' }, canceled: { label: 'Cancelada', tone: 'gray' },
};

// Ações: área que pode executar, rótulo, campos extras e se é "perigosa" (botão vermelho + confirmação)
export const ORG_ACTIONS = {
    extend_trial: { area: 'financeiro', label: 'Estender teste', fields: [{ name: 'days', label: 'Dias (1 a 60)', min: 1, max: 60, initial: 7 }] },
    grant_credits: {
        area: 'financeiro', label: 'Conceder créditos de cortesia',
        fields: [{ name: 'credits', label: 'Créditos (1 a 10.000)', min: 1, max: 10000, initial: 50 },
            { name: 'valid_days', label: 'Validade em dias (1 a 365)', min: 1, max: 365, initial: 90 }],
    },
    deactivate: { area: 'ti', label: 'Desativar escritório', danger: true, fields: [] },
    activate: { area: 'ti', label: 'Reativar escritório', fields: [] },
};

export const USER_ACTIONS = {
    unlock: { label: 'Desbloquear login', fields: [] },
    send_password_reset: { label: 'Enviar link de nova senha', fields: [] },
    revoke_sessions: { label: 'Encerrar sessões', fields: [] },
    reset_mfa: { label: 'Redefinir verificação em duas etapas', danger: true, fields: [] },
    deactivate: { label: 'Desativar conta', danger: true, fields: [] },
    activate: { label: 'Reativar conta', fields: [] },
};

export const MIN_REASON = 10;

export function hasArea(areas, area) {
    return Array.isArray(areas) && areas.includes(area);
}

export function orgActionsFor(areas, org) {
    return Object.entries(ORG_ACTIONS)
        .filter(([, a]) => hasArea(areas, a.area))
        .filter(([key]) => (key === 'deactivate' ? org?.ativo : key === 'activate' ? !org?.ativo : true))
        .filter(([key]) => key !== 'extend_trial' || org?.estado_registrado === 'trialing')
        .map(([key, a]) => ({ key, ...a }));
}

export function userActionsFor(user) {
    return Object.entries(USER_ACTIONS)
        .filter(([key]) => (key === 'deactivate' ? user?.ativo : key === 'activate' ? !user?.ativo : true))
        .filter(([key]) => key !== 'unlock' || user?.bloqueado)
        .filter(([key]) => key !== 'send_password_reset' || user?.ativo)
        .filter(([key]) => key !== 'reset_mfa' || user?.mfa)
        .map(([key, a]) => ({ key, ...a }));
}

// Valida o formulário de ação antes de mandar ao back (o back valida de novo). Devolve {ok, body | error}.
export function buildActionBody(action, values, spec) {
    const reason = String(values.reason || '').trim();
    if (reason.length < MIN_REASON) return { ok: false, error: `Informe o motivo (mínimo ${MIN_REASON} caracteres).` };
    const body = { action, reason };
    for (const f of spec?.fields || []) {
        const n = Number(values[f.name]);
        if (!Number.isInteger(n) || n < f.min || n > f.max) return { ok: false, error: `${f.label}: valor inválido.` };
        body[f.name] = n;
    }
    return { ok: true, body };
}

export const CONFIG_LABEL = {
    email: 'E-mail transacional', stripe: 'Stripe (pagamentos)', stripe_webhook: 'Webhook do Stripe', sentry: 'Sentry (erros)',
    sso_google: 'Login com Google', sso_microsoft: 'Login com Microsoft', datajud: 'DataJud (processos)',
    openai: 'OpenAI', groq: 'Groq', gemini: 'Gemini',
};
