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

// CAD-234: carteira de clientes por pastas (pasta = cliente, arquivos = documentos), do Google Drive ou de um .zip.
// Contrato: imports/folders_api.py (/api/v1/imports/pastas/)
export const foldersApi = {
    state: () => api.get('imports/pastas/').then((r) => r.data),
    fromDrive: (link) => api.post('imports/pastas/', { link }).then((r) => r.data),
    fromZip: (file) => {
        const form = new FormData();
        form.append('arquivo', file);
        return api.post('imports/pastas/zip/', form).then((r) => r.data);
    },
    get: (id) => api.get(`imports/pastas/${id}/`).then((r) => r.data),
    run: (id, selecionadas, lerComIa) => api.post(`imports/pastas/${id}/importar/`, { selecionadas, ler_com_ia: !!lerComIa }).then((r) => r.data),
    cancel: (id) => api.delete(`imports/pastas/${id}/`),
    // pede ao Google a leitura do Drive (só nessa hora) e volta para esta tela
    authorizeDrive: () => api.post('integrations/google-calendar/connect/', { acesso: 'drive_leitura', volta: 'importar' }).then((r) => r.data),
};

// "12,3 MB"
export function fmtBytes(n) {
    const v = Number(n) || 0;
    if (v < 1024 * 1024) return `${Math.max(1, Math.round(v / 1024))} KB`;
    if (v < 1024 ** 3) return `${(v / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
    return `${(v / 1024 ** 3).toFixed(1).replace('.', ',')} GB`;
}

// Progresso (0–100) de uma importação de pastas em andamento
export function folderProgress(p) {
    if (!p?.total) return 0;
    return Math.min(100, Math.round((100 * (p.feitas || 0)) / p.total));
}
