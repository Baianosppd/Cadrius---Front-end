// Importação de planilhas (CAD-171). Contrato: imports/api.py no back (/api/v1/imports/)
import api from './api';

export const importsApi = {
    list: () => api.get('imports/').then((r) => r.data),
    upload: (file, target) => {
        const form = new FormData();
        form.append('file', file);
        form.append('target', target);
        return api.post('imports/', form).then((r) => r.data);
    },
    preview: (id, mapping) => api.post(`imports/${id}/preview/`, { mapping }).then((r) => r.data),
    commit: (id) => api.post(`imports/${id}/commit/`).then((r) => r.data),
    cancel: (id) => api.delete(`imports/${id}/`),
};

export const TARGETS = [['contacts', 'Contatos (clientes, partes, testemunhas…)'], ['cases', 'Processos (para monitorar andamentos)']];
export const MAX_MB = 2;

// Campos obrigatórios que ainda não têm coluna
export function missingRequired(fields, mapping) {
    const used = new Set(Object.values(mapping || {}).filter(Boolean));
    return (fields || []).filter((f) => f.required && !used.has(f.key)).map((f) => f.label);
}

// Troca o campo de uma coluna; se outro já usava esse campo, libera o outro (cada campo recebe uma coluna só)
export function setColumnField(mapping, colIndex, field) {
    const next = {};
    Object.entries(mapping || {}).forEach(([k, v]) => { if (v && v !== field && k !== String(colIndex)) next[k] = v; });
    if (field) next[String(colIndex)] = field;
    return next;
}

export const ACTION_TONE = { criar: 'green', atualizar: 'blue', erro: 'red' };
