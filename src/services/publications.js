// Caixa de publicações (DJEN) e minutas (CAD-173). Contrato: publications/api.py e minutas/api.py no back
import api from './api';

export const publicationsApi = {
    list: (params) => api.get('publications/', { params }).then((r) => r.data),
    get: (id) => api.get(`publications/${id}/`).then((r) => r.data),
    prazo: (id, dias) => api.get(`publications/${id}/prazo/`, { params: { dias } }).then((r) => r.data),
    confirm: (id, body) => api.post(`publications/${id}/confirm/`, body).then((r) => r.data),
    discard: (id, motivo) => api.post(`publications/${id}/discard/`, { motivo }).then((r) => r.data),
    reopen: (id) => api.post(`publications/${id}/reopen/`).then((r) => r.data),
    oabs: () => api.get('publications/oabs/').then((r) => r.data),
    addOab: (body) => api.post('publications/oabs/', body).then((r) => r.data),
    updateOab: (id, body) => api.patch(`publications/oabs/${id}/`, body).then((r) => r.data),
    removeOab: (id) => api.delete(`publications/oabs/${id}/`),
    checkOab: (id) => api.post(`publications/oabs/${id}/check-now/`).then((r) => r.data),
};

export const minutasApi = {
    list: (params) => api.get('minutas/', { params }).then((r) => r.data),
    get: (id) => api.get(`minutas/${id}/`).then((r) => r.data),
    generate: (body) => api.post('minutas/', body).then((r) => r.data),
    update: (id, body) => api.patch(`minutas/${id}/`, body).then((r) => r.data),
    remove: (id) => api.delete(`minutas/${id}/`),
    docx: (id) => api.get(`minutas/${id}/docx/`, { responseType: 'blob' }).then((r) => r.data),
    templates: () => api.get('minutas/modelos/').then((r) => r.data),
    addTemplate: (body) => api.post('minutas/modelos/', body).then((r) => r.data),
    removeTemplate: (id) => api.delete(`minutas/modelos/${id}/`),
};

export const PUB_STATUS = [['nova', 'Novas'], ['confirmada', 'Confirmadas'], ['descartada', 'Descartadas']];

// Confiança da triagem → cor e texto
export function confidenceTone(value) {
    if (value >= 75) return ['green', 'alta'];
    if (value >= 55) return ['yellow', 'média'];
    return ['orange', 'baixa — confira'];
}

// Corpo da confirmação: só manda o que o advogado mudou
export function confirmBody(form, triage = {}) {
    const body = { acompanhar: !!form.acompanhar };
    const dias = Number(form.prazo_dias);
    if (form.prazo_dias !== '' && form.prazo_dias !== undefined && dias !== triage.prazo_dias) body.prazo_dias = dias;
    if (form.vencimento) body.vencimento = form.vencimento;
    if (form.observacao?.trim()) body.observacao = form.observacao.trim();
    return body;
}

// Quantas marcações [COMPLETAR: …] ainda há no texto
export const countPending = (text) => (String(text || '').match(/\[COMPLETAR/g) || []).length;

// Destaca a próxima pendência: devolve [início, fim] do próximo "[COMPLETAR: …]" a partir de pos (ou do começo)
export function nextPending(text, pos = 0) {
    const s = String(text || '');
    const rx = /\[COMPLETAR[^\]]*\]/g;
    rx.lastIndex = pos;
    let m = rx.exec(s);
    if (!m && pos > 0) { rx.lastIndex = 0; m = rx.exec(s); }
    return m ? [m.index, m.index + m[0].length] : null;
}

// Nome de arquivo seguro: sem acentos (alguns navegadores descartam o nome com caracteres fora do ASCII)
export function docxName(title) {
    const base = String(title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\- ]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    return `${base || 'minuta'}.docx`;
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
