// Suporte com a equipe Cadrius (CAD-171). Contrato: support/api.py no back
import api from './api';

export const supportApi = {
    list: () => api.get('support/tickets/').then((r) => r.data),
    open: (body) => api.post('support/tickets/', body).then((r) => r.data),
    get: (id) => api.get(`support/tickets/${id}/`).then((r) => r.data),
    reply: (id, body) => api.post(`support/tickets/${id}/messages/`, { body }).then((r) => r.data),
    setStatus: (id, action) => api.post(`support/tickets/${id}/status/`, { action }).then((r) => r.data),
    grant: (id, hours) => api.post(`support/tickets/${id}/access/`, { hours }).then((r) => r.data),
    revoke: (id) => api.delete(`support/tickets/${id}/access/`).then((r) => r.data),
    // equipe Cadrius (área Suporte ou TI)
    queue: (params) => api.get('backoffice/support/tickets/', { params }).then((r) => r.data),
    staffGet: (id) => api.get(`backoffice/support/tickets/${id}/`).then((r) => r.data),
    staffReply: (id, body, internal) => api.post(`backoffice/support/tickets/${id}/`, { body, internal }).then((r) => r.data),
    staffUpdate: (id, body) => api.patch(`backoffice/support/tickets/${id}/`, body).then((r) => r.data),
};

export const CATEGORIES = [['duvida', 'Dúvida'], ['problema', 'Problema / erro'], ['financeiro', 'Financeiro / assinatura'],
    ['integracao', 'Integração'], ['sugestao', 'Sugestão'], ['outro', 'Outro']];

export const STATUS = {
    aberto: { label: 'Aberto', tone: 'blue' }, em_andamento: { label: 'Em andamento', tone: 'yellow' },
    aguardando_cliente: { label: 'Aguardando você', tone: 'orange' }, resolvido: { label: 'Resolvido', tone: 'green' },
    fechado: { label: 'Fechado', tone: 'gray' },
};
export const STAFF_STATUS = { ...STATUS, aguardando_cliente: { label: 'Aguardando cliente', tone: 'orange' } };
export const PRIORITY = { baixa: { label: 'Baixa', tone: 'gray' }, normal: { label: 'Normal', tone: 'blue' },
    alta: { label: 'Alta', tone: 'yellow' }, urgente: { label: 'Urgente', tone: 'red' } };

// Validação do formulário de novo chamado (o back valida de novo)
export function ticketBody(form, pageUrl) {
    const subject = String(form.subject || '').trim();
    const body = String(form.body || '').trim();
    if (subject.length < 5) return { ok: false, error: 'Informe o assunto (mínimo 5 caracteres).' };
    if (body.length < 5) return { ok: false, error: 'Descreva o que aconteceu (mínimo 5 caracteres).' };
    return { ok: true, body: { subject, body, category: form.category || 'duvida', priority: form.priority === 'alta' ? 'alta' : 'normal', page_url: pageUrl || '' } };
}

export function isActive(status) {
    return !['resolvido', 'fechado'].includes(status);
}
