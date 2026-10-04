// Leitura automática de documentos (CAD-163). Contrato: documents/views.py
import api from './api';

export const documentsApi = {
    get: (id) => api.get(`documentos/${id}/`).then((r) => r.data),
    extraction: (id) => api.get(`documentos/${id}/extraction/`).then((r) => r.data),
    reprocess: (id) => api.post(`documentos/${id}/extraction/reprocess/`).then((r) => r.data),
    confirm: (id, fields) => api.post(`documentos/${id}/extraction/confirm/`, { fields }).then((r) => r.data),
    download: (id) => api.get(`documentos/${id}/download/`, { responseType: 'blob' }).then((r) => r.data),
};

export const EXTRACTION_STATUS = {
    pending: { label: 'Na fila', tone: 'info', busy: true },
    processing: { label: 'Lendo o documento…', tone: 'info', busy: true },
    review: { label: 'Aguardando sua revisão', tone: 'warn', busy: false },
    confirmed: { label: 'Confirmado', tone: 'success', busy: false },
    failed: { label: 'Não foi possível ler', tone: 'danger', busy: false },
    skipped: { label: 'Não processado', tone: 'warn', busy: false },
};

export const DOC_TYPES = [['PETICAO', 'Petição'], ['SENTENCA', 'Sentença'], ['DECISAO', 'Decisão'], ['INTIMACAO', 'Intimação'],
    ['CONTRATO', 'Contrato'], ['PROCURACAO', 'Procuração'], ['CERTIDAO', 'Certidão'], ['OUTRO', 'Outro']];

export const isBusy = (status) => !!EXTRACTION_STATUS[status]?.busy;

// Garante a forma esperada dos campos (a IA pode devolver listas ausentes) para o formulário de revisão
export function normalizeFields(fields = {}) {
    return {
        tipo_documento: fields.tipo_documento || 'OUTRO',
        numero_processo: fields.numero_processo || '',
        resumo: fields.resumo || '',
        valor: fields.valor || '',
        partes: (fields.partes || []).map((p) => ({ papel: p.papel || '', nome: p.nome || '' })),
        prazos: (fields.prazos || []).map((p) => ({ descricao: p.descricao || '', data: p.data || '', dias: p.dias ?? null, fatal: !!p.fatal })),
        proximos_passos: fields.proximos_passos || [],
    };
}

// Corpo enviado ao confirmar: data vazia vira null (prazo sem data não vira tarefa), textos aparados
export function fieldsForConfirm(form) {
    return {
        ...form,
        numero_processo: form.numero_processo.trim() || null,
        valor: form.valor.trim() || null,
        resumo: form.resumo.trim(),
        partes: form.partes.filter((p) => p.nome.trim()).map((p) => ({ papel: p.papel.trim() || 'Parte', nome: p.nome.trim() })),
        prazos: form.prazos.filter((p) => p.descricao.trim()).map((p) => ({ ...p, descricao: p.descricao.trim(), data: p.data || null })),
        proximos_passos: form.proximos_passos.map((s) => s.trim()).filter(Boolean),
    };
}
