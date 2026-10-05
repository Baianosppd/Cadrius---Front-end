// Integrações (CAD-174): catálogo com guias, teste de conexão, assinatura (ZapSign) e cobrança (Asaas). Contrato: integrations/api_v1.py
import api from './api';

export const integrationsApi = {
    catalog: () => api.get('integrations/catalog/').then((r) => r.data),
    connections: () => api.get('connections/').then((r) => r.data),
    create: (body) => api.post('connections/', body).then((r) => r.data),
    remove: (id) => api.delete(`connections/${id}/`),
    test: (id) => api.post(`integrations/connections/${id}/test/`).then((r) => r.data),
    signature: (body) => api.post('integrations/signature/', body).then((r) => r.data),
    charge: (body) => api.post('integrations/charge/', body).then((r) => r.data),
};

// Campos obrigatórios que faltam (mesma regra do back)
export function missingFields(app, values) {
    return (app?.campos || []).filter((f) => f.required && !String(values?.[f.key] ?? '').trim()).map((f) => f.label);
}

// Agrupa o catálogo por categoria, na ordem que o back define; filtro opcional por texto
export function groupByCategory(catalog, query = '') {
    const q = query.trim().toLowerCase();
    const apps = (catalog?.apps || []).filter((a) => !q || `${a.label} ${a.uso} ${a.categoria}`.toLowerCase().includes(q));
    return (catalog?.categorias || []).map((c) => ({ categoria: c, apps: apps.filter((a) => a.categoria === c) })).filter((g) => g.apps.length);
}
