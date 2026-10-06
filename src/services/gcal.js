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
    // CAD-222: compromissos criados direto no Google
    settings: (body) => api.patch(`${BASE}settings/`, body).then((r) => r.data),
    events: (params) => api.get(`${BASE}events/`, { params }).then((r) => r.data),
    updateEvent: (id, body) => api.patch(`${BASE}events/${id}/`, body).then((r) => r.data),
};

export const EVENT_KINDS = [['prazo', 'Prazo'], ['audiencia', 'Audiência'], ['pericia', 'Perícia / diligência'], ['reuniao', 'Reunião / atendimento'],
    ['outro', 'Outro compromisso']];

// Modelos de alerta prontos para os compromissos (automations/templates.py)
export const AGENDA_ALERTS = [
    { modelo: 'agenda_audiencia_cliente', titulo: 'Lembrar o cliente da audiência 1 dia antes', canal: 'WhatsApp ou e-mail (o que ele autorizou)' },
    { modelo: 'agenda_prazo_equipe', titulo: 'Avisar a equipe 2 dias antes de cada prazo', canal: 'Sino do Cadrius' },
];

export const GCAL_RESULTS = {
    ok: { tone: 'success', text: 'Google Calendar conectado!' },
    denied: { tone: 'error', text: 'Você cancelou a autorização no Google.' },
    state_invalid: { tone: 'error', text: 'A sessão da conexão expirou. Tente conectar de novo.' },
    code_rejected: { tone: 'error', text: 'O Google recusou as credenciais do app. Confira o ID e o segredo do cliente.' },
    no_refresh_token: { tone: 'error', text: 'O Google não devolveu permissão de longa duração. Remova o acesso do Cadrius em myaccount.google.com/permissions e conecte de novo.' },
};

export const gcalResult = (code) => GCAL_RESULTS[code] || null;

export const GCAL_STATUS_LABEL = { active: 'Conectado', needs_reauth: 'Precisa reconectar' };
