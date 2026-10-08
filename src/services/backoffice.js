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
    // Equipe Cadrius (TI) e setor Fiscal — CAD-170
    staff: () => api.get(`${BASE}staff/`).then((r) => r.data),
    createStaff: (body) => api.post(`${BASE}staff/`, body).then((r) => r.data),
    updateStaff: (id, body) => api.patch(`${BASE}staff/${id}/`, body).then((r) => r.data),
    fiscalPayments: (params) => api.get(`${BASE}fiscal/payments/`, { params }).then((r) => r.data),
    fiscalInvoice: (id, body) => api.post(`${BASE}fiscal/payments/${id}/invoice/`, body).then((r) => r.data),
    fiscalExport: (params) => api.get(`${BASE}fiscal/payments/export.csv`, { params, responseType: 'blob' }).then((r) => r.data),
    fiscalNfse: (id) => api.get(`${BASE}fiscal/payments/${id}/nfse/`).then((r) => r.data),
    fiscalNfseAction: (id, body) => api.post(`${BASE}fiscal/payments/${id}/nfse/`, body).then((r) => r.data),
    fiscalObligations: () => api.get(`${BASE}fiscal/obligations/`).then((r) => r.data),
    fiscalObligationUpdate: (body) => api.patch(`${BASE}fiscal/obligations/`, body).then((r) => r.data),
    // Cibersegurança (CAD-221)
    cyber: () => api.get(`${BASE}cyber/`).then((r) => r.data),
    blockIp: (body) => api.post(`${BASE}cyber/blocked-ips/`, body).then((r) => r.data),
    unblockIp: (id) => api.delete(`${BASE}cyber/blocked-ips/${id}/`),
    reviewAlert: (id, status) => api.post(`${BASE}cyber/alerts/${id}/review/`, { status }).then((r) => r.data),
    fiscalObligationDone: (id, body) => api.post(`${BASE}fiscal/obligations/${id}/done/`, body).then((r) => r.data),
};

export const AREA_LABEL = { ti: 'TI', financeiro: 'Financeiro', fiscal: 'Fiscal', suporte: 'Suporte', marketing: 'Marketing', juridico: 'Jurídico' };
export const AREAS = Object.keys(AREA_LABEL);

export const NF_STATUS = {
    pending: { label: 'NF pendente', tone: 'yellow' }, issued: { label: 'NF emitida', tone: 'green' },
    not_required: { label: 'Sem NF', tone: 'gray' },
    processing: { label: 'NFS-e em processamento', tone: 'blue' }, error: { label: 'NFS-e com erro', tone: 'red' },
    canceled: { label: 'NF cancelada', tone: 'gray' },
};
// Situações que a equipe registra à mão (fase 1); as demais vêm do emissor (CAD-175)
export const NF_MANUAL = ['pending', 'issued', 'not_required'];

export const OBLIGATION_STATUS = {
    pendente: { label: 'Pendente', tone: 'blue' }, hoje: { label: 'Vence hoje', tone: 'yellow' },
    atrasado: { label: 'Atrasada', tone: 'red' }, feito: { label: 'Feita', tone: 'green' },
};

// Formulário de nova conta da equipe → corpo da API (valida o básico; o back valida de novo)
export function buildStaffBody(form) {
    const email = String(form.email || '').trim().toLowerCase();
    const areas = AREAS.filter((a) => form.areas?.includes(a));
    const consulta = AREAS.filter((a) => form.consulta?.includes(a) && !areas.includes(a));     // CAD-223: só leitura
    const reason = String(form.reason || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'E-mail inválido.' };
    if (!areas.length && !consulta.length) return { ok: false, error: 'Escolha ao menos uma área.' };
    if (reason.length < MIN_REASON) return { ok: false, error: `Informe o motivo (mínimo ${MIN_REASON} caracteres).` };
    return { ok: true, body: { email, first_name: String(form.first_name || '').trim(), last_name: String(form.last_name || '').trim(), areas, consulta, reason } };
}

// Primeiro e último dia do mês de uma data (AAAA-MM-DD), para o filtro do Fiscal
export function monthRange(d = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const first = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return { start: first, end: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(lastDay)}` };
}

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
    // CAD-231: adicional "Estúdio de mídia com IA" como cortesia
    media_addon_on: { area: 'financeiro', label: 'Liberar estúdio de mídia com IA (cortesia)', fields: [{ name: 'days', label: 'Dias (0 = sem prazo)', min: 0, max: 365, initial: 30 }] },
    media_addon_off: { area: 'financeiro', label: 'Encerrar cortesia do estúdio de mídia', danger: true, fields: [] },
    deactivate: { area: 'ti', label: 'Desativar escritório', danger: true, fields: [] },
    activate: { area: 'ti', label: 'Reativar escritório', fields: [] },
};

export const USER_ACTIONS = {
    unlock: { label: 'Desbloquear login', fields: [] },
    send_password_reset: { label: 'Enviar link de nova senha', fields: [] },
    temp_password: { label: 'Definir senha temporária (troca no próximo acesso)', danger: true, fields: [] },
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
        .filter(([key]) => key !== 'media_addon_on' || (org?.adicional_midia && !org.adicional_midia.ativo))
        .filter(([key]) => key !== 'media_addon_off' || org?.adicional_midia?.origem === 'cortesia')
        .map(([key, a]) => ({ key, ...a }));
}

export function userActionsFor(user) {
    return Object.entries(USER_ACTIONS)
        .filter(([key]) => (key === 'deactivate' ? user?.ativo : key === 'activate' ? !user?.ativo : true))
        .filter(([key]) => key !== 'unlock' || user?.bloqueado)
        .filter(([key]) => !['send_password_reset', 'temp_password'].includes(key) || user?.ativo)
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
