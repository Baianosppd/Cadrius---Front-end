// Google Calendar por escritório (CAD-162). Contrato: gcal/api.py
import api from './api';

const BASE = 'integrations/google-calendar/';

export const gcal = {
    status: () => api.get(BASE).then((r) => r.data),
    saveApp: (body) => api.put(`${BASE}app/`, body).then((r) => r.data),
    removeApp: () => api.delete(`${BASE}app/`),
    connect: () => api.post(`${BASE}connect/`).then((r) => r.data),
    disconnect: () => api.post(`${BASE}disconnect/`),
    syncNow: () => api.post(`${BASE}sync-now/`).then((r) => r.data),
};

export const GCAL_RESULTS = {
    ok: { tone: 'success', text: 'Google Calendar conectado!' },
    denied: { tone: 'error', text: 'Você cancelou a autorização no Google.' },
    state_invalid: { tone: 'error', text: 'A sessão da conexão expirou. Tente conectar de novo.' },
    code_rejected: { tone: 'error', text: 'O Google recusou as credenciais do app. Confira o ID e o segredo do cliente.' },
    no_refresh_token: { tone: 'error', text: 'O Google não devolveu permissão de longa duração. Remova o acesso do Cadrius em myaccount.google.com/permissions e conecte de novo.' },
};

export const gcalResult = (code) => GCAL_RESULTS[code] || null;

export const GCAL_STATUS_LABEL = { active: 'Conectado', needs_reauth: 'Precisa reconectar' };
