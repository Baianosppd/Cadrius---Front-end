// Carteira de clientes (funil + contratos), financeiro do escritório e portal do cliente (CAD-175).
// Contratos: carteira/api.py e portal/api.py
import api from './api';

const BASE = 'carteira/';

export const carteiraApi = {
    opportunities: (params) => api.get(`${BASE}oportunidades/`, { params }).then((r) => r.data),
    createOpportunity: (body) => api.post(`${BASE}oportunidades/`, body).then((r) => r.data),
    updateOpportunity: (id, body) => api.patch(`${BASE}oportunidades/${id}/`, body).then((r) => r.data),
    removeOpportunity: (id) => api.delete(`${BASE}oportunidades/${id}/`),
    agreements: (params) => api.get(`${BASE}contratos/`, { params }).then((r) => r.data),
    agreement: (id) => api.get(`${BASE}contratos/${id}/`).then((r) => r.data),
    createAgreement: (body) => api.post(`${BASE}contratos/`, body).then((r) => r.data),
    agreementAction: (id, action, body) => api.post(`${BASE}contratos/${id}/${action}/`, body || {}).then((r) => r.data),
    receivables: (params) => api.get(`${BASE}lancamentos/`, { params }).then((r) => r.data),
    createReceivable: (body) => api.post(`${BASE}lancamentos/`, body).then((r) => r.data),
    receivableAction: (id, action, body) => api.post(`${BASE}lancamentos/${id}/${action}/`, body || {}).then((r) => r.data),
    expenses: (params) => api.get(`${BASE}despesas/`, { params }).then((r) => r.data),
    createExpense: (body) => api.post(`${BASE}despesas/`, body).then((r) => r.data),
    removeExpense: (id) => api.delete(`${BASE}despesas/${id}/`),
    summary: (params) => api.get(`${BASE}painel/`, { params }).then((r) => r.data),
    client: (id) => api.get(`${BASE}clientes/${id}/`).then((r) => r.data),
    asaasWebhook: () => api.post(`${BASE}asaas/webhook-config/`).then((r) => r.data),
};

export const portalApi = {
    links: (contato) => api.get('portal/links/', { params: { contato } }).then((r) => r.data),
    create: (body) => api.post('portal/links/', body).then((r) => r.data),
    revoke: (id) => api.post(`portal/links/${id}/revogar/`).then((r) => r.data),
    access: (token) => api.get(`portal/acesso/${encodeURIComponent(token)}/`).then((r) => r.data),
};

export const STAGES = [
    ['novo', 'Novo contato'], ['qualificacao', 'Entendendo o caso'], ['reuniao', 'Reunião marcada'],
    ['proposta', 'Proposta enviada'], ['ganho', 'Contrato fechado'], ['perdido', 'Não fechou'],
];
export const OPEN_STAGES = ['novo', 'qualificacao', 'reuniao', 'proposta'];
export const SOURCES = [
    ['indicacao', 'Indicação'], ['site', 'Site / blog'], ['redes', 'Redes sociais'], ['google', 'Google / Perfil da empresa'],
    ['cliente', 'Cliente da casa'], ['outro', 'Outro'],
];
export const AGREEMENT_KINDS = [
    ['avista', 'À vista'], ['parcelado', 'Parcelado'], ['mensal', 'Mensal (partido/recorrente)'], ['exito', 'Êxito (% do proveito)'],
    ['misto', 'Entrada + êxito'],
];
export const EXPENSE_CATEGORIES = [
    ['custas', 'Custas processuais'], ['diligencia', 'Diligência / correspondente'], ['pericia', 'Perícia / assistente técnico'],
    ['deslocamento', 'Deslocamento'], ['copias', 'Cópias / cartório'], ['escritorio', 'Despesa do escritório'], ['outros', 'Outros'],
];
export const METHODS = [['pix', 'Pix'], ['boleto', 'Boleto'], ['cartao', 'Cartão'], ['transferencia', 'Transferência'], ['dinheiro', 'Dinheiro'], ['outro', 'Outro']];
export const REC_STATUS = { aberto: ['Em aberto', 'blue'], pago: ['Pago', 'green'], cancelado: ['Cancelado', 'gray'] };
export const AGREEMENT_STATUS = { ativo: ['Ativo', 'green'], encerrado: ['Encerrado', 'gray'], cancelado: ['Cancelado', 'red'] };

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function brl(cents) {
    return fmt.format((Number(cents) || 0) / 100).replace(/[\u00a0\u202f]/g, ' ');
}

// "1.234,56" | "1234.56" | "R$ 1.234,56" → centavos (null se inválido)
export function parseBRL(text) {
    let raw = String(text ?? '').replace(/[^\d,.-]/g, '');
    if (!raw) return null;
    if (raw.includes(',')) raw = raw.replace(/\./g, '').replace(',', '.');
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

function addMonths(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    const target = new Date(Date.UTC(y, m - 1 + n, 1));
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d, last));
    return target.toISOString().slice(0, 10);
}

// Prévia das parcelas — mesma regra do back (carteira/services.py: schedule_for/split)
export function previewSchedule(kind, totalCents, installments, firstDue) {
    if (kind === 'exito' || !totalCents || !firstDue) return [];
    const n = ['parcelado', 'mensal', 'misto'].includes(kind) ? Math.max(1, Math.min(120, Number(installments) || 1)) : 1;
    if (kind === 'mensal') return Array.from({ length: n }, (_, i) => ({ label: `Mensalidade ${i + 1}/${n}`, cents: totalCents, due: addMonths(firstDue, i) }));
    const base = Math.floor(totalCents / n);
    const label = kind === 'misto' ? 'Entrada' : 'Parcela';
    return Array.from({ length: n }, (_, i) => ({
        label: n === 1 ? (kind === 'avista' ? 'Honorários' : label) : `${label} ${i + 1}/${n}`,
        cents: i === 0 ? base + (totalCents - base * n) : base,
        due: addMonths(firstDue, i),
    }));
}

export function groupByStage(opportunities) {
    const out = Object.fromEntries(STAGES.map(([k]) => [k, []]));
    for (const o of opportunities || []) (out[o.etapa] || (out[o.etapa] = [])).push(o);
    return out;
}

export function stageTotal(list) {
    return (list || []).reduce((sum, o) => sum + (o.valor_centavos || 0), 0);
}

export function monthBars(rows) {
    const max = Math.max(1, ...(rows || []).flatMap((r) => [r.recebido, r.despesas]));
    return (rows || []).map((r) => ({ ...r, recebidoPct: Math.round((100 * r.recebido) / max), despesasPct: Math.round((100 * r.despesas) / max) }));
}
