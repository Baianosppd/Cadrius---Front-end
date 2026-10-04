// Motor Cadrius: Central de aprovações, regras, autonomia e memória (CAD-165). Contrato: brain/api.py
import api from './api';

const BASE = 'brain/';

export const brainApi = {
    approvals: () => api.get(`${BASE}approvals/`).then((r) => r.data),
    rules: () => api.get(`${BASE}rules/`).then((r) => r.data),
    decideRule: (id, decision) => api.post(`${BASE}rules/${id}/decide/`, { decision }).then((r) => r.data),
    autonomy: () => api.get(`${BASE}autonomy/`).then((r) => r.data),
    setAutonomy: (kind, mode) => api.put(`${BASE}autonomy/${kind}/`, { mode }).then((r) => r.data),
    decideProposal: (id, decision) => api.post(`${BASE}autonomy/proposals/${id}/decide/`, { decision }).then((r) => r.data),
    memory: () => api.get(`${BASE}memory/`).then((r) => r.data),
    addMemory: (body) => api.post(`${BASE}memory/`, body).then((r) => r.data),
    deleteMemory: (id) => api.delete(`${BASE}memory/${id}/`),
    searchMemory: (q, kind) => api.get(`${BASE}memory/search/`, { params: { q, ...(kind ? { kind } : {}) } }).then((r) => r.data),
};

export const MODE_LABEL = {
    off: 'Desligada',
    review: 'Sugere e espera a aprovação',
    auto: 'Faz sozinha (desfazível)',
    auto_undo: 'Faz sozinha (desfazível por 24 h)',
};
export const RISK_LABEL = {
    R1: 'R1 · rascunho interno', R2: 'R2 · ação interna reversível', R3: 'R3 · efeito externo', R4: 'R4 · alto impacto — sempre o advogado decide',
};
export const MEMORY_KIND = { extraction_example: 'Leitura aprovada', template: 'Modelo de peça', note: 'Anotação', decision: 'Decisão/entendimento' };

export const pct = (v) => `${Math.round(Number(v || 0) * 100)}%`;

// Quanto falta para a IA "merecer" mais autonomia (para mostrar a barra de progresso na matriz)
export function promotionProgress(row, criteria) {
    if (!criteria || row.locked) return null;
    const volume = Math.min(row.samples / criteria.min_samples, 1);
    const quality = row.samples ? Math.min(Number(row.approval_rate) / Number(criteria.min_approval_rate), 1) : 0;
    const blocked = row.rejected > 0 || row.undone > 0;
    return { volume, quality, blocked, ready: volume >= 1 && quality >= 1 && !blocked };
}
