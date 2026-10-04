// Área administrativa do financeiro (equipe Cadrius, is_staff) — CAD-160. Contrato: billing/admin_api.py
import api, { API_ORIGIN } from './api';

const BASE = `${API_ORIGIN}/api/billing/admin/`;

export const adminApi = {
    list: (resource) => api.get(`${BASE}${resource}/`).then((r) => r.data),
    create: (resource, body) => api.post(`${BASE}${resource}/`, body).then((r) => r.data),
    update: (resource, id, body) => api.patch(`${BASE}${resource}/${id}/`, body).then((r) => r.data),
    remove: (resource, id) => api.delete(`${BASE}${resource}/${id}/`),
    summary: () => api.get(`${BASE}summary/`).then((r) => r.data),
    priceHistory: () => api.get(`${BASE}price-history/`).then((r) => r.data),
};

export const TIERS = [['FREE', 'Trial gratuito'], ['START', 'Start'], ['PRO', 'Pro'], ['ENTERPRISE', 'Business']];
export const STATUSES = [['trialing', 'Em teste'], ['active', 'Ativa'], ['past_due', 'Pagamento pendente'],
    ['restricted', 'Restrita'], ['suspended', 'Suspensa'], ['canceled', 'Cancelada']];

export const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// <input type="datetime-local"> ⇄ ISO do back
export const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);

// Converte o estado do formulário no corpo da API (números, datas e vazios → null)
export function formToBody(fields, form) {
    const body = {};
    for (const f of fields) {
        const v = form[f.name];
        if (f.type === 'number') body[f.name] = v === '' || v === undefined || v === null ? null : Number(v);
        else if (f.type === 'datetime') body[f.name] = fromLocalInput(v);
        else if (f.type === 'tiers' || f.type === 'statuses') body[f.name] = Array.isArray(v) ? v : [];
        else if (f.type === 'checkbox') body[f.name] = !!v;
        else body[f.name] = v ?? '';
        if (f.nullable && (body[f.name] === '' || body[f.name] === undefined)) body[f.name] = null;
    }
    return body;
}

export function apiErrors(err) {
    const d = err?.response?.data;
    if (!d) return ['Não foi possível salvar. Tente novamente.'];
    if (typeof d === 'string') return [d];
    if (d.detail) return [String(d.detail)];
    return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`);
}
