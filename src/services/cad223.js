// CAD-223: grupos de acesso, financeiro/fiscal do escritório, captação e satisfação, calendário forense, parametrização,
// conformidade das automações e CNPJ pela Receita. Contratos: accounts/access_api.py, carteira/api.py, marketing/api_leads.py,
// forense/api.py, support/api.py e automations/api.py no back.
import api from './api';

const d = (r) => r.data;

export const accessApi = {
    catalog: () => api.get('teams/access/catalog/').then(d),
    groups: () => api.get('teams/access/groups/').then(d),
    create: (body) => api.post('teams/access/groups/', body).then(d),
    update: (id, body) => api.patch(`teams/access/groups/${id}/`, body).then(d),
    remove: (id) => api.delete(`teams/access/groups/${id}/`),
    members: () => api.get('teams/members/').then(d),
    assign: (memberId, grupoId) => api.patch(`teams/members/${memberId}/access/`, { grupo_id: grupoId || null }).then(d),
};

export const financeApi = {
    config: () => api.get('carteira/financeiro/config/').then(d),
    saveConfig: (body) => api.patch('carteira/financeiro/config/', body).then(d),
    recurring: () => api.get('carteira/financeiro/recorrentes/').then(d),
    addRecurring: (body) => api.post('carteira/financeiro/recorrentes/', body).then(d),
    updateRecurring: (id, body) => api.patch(`carteira/financeiro/recorrentes/${id}/`, body).then(d),
    removeRecurring: (id) => api.delete(`carteira/financeiro/recorrentes/${id}/`),
    cashFlow: (semanas = 12) => api.get('carteira/financeiro/fluxo/', { params: { semanas } }).then(d),
    indicators: (ano) => api.get('carteira/financeiro/indicadores/', { params: ano ? { ano } : {} }).then(d),
    fiscal: (mes) => api.get('carteira/financeiro/fiscal/', { params: mes ? { mes } : {} }).then(d),
    accountantCsv: (inicio, fim) => api.get('carteira/financeiro/contador.csv', { params: { inicio, fim }, responseType: 'blob' }),
    issueNfse: (receivableId) => api.post(`carteira/lancamentos/${receivableId}/nota/`, {}).then(d),
};

export const leadsApi = {
    forms: () => api.get('marketing/formularios/').then(d),
    createForm: (body) => api.post('marketing/formularios/', body).then(d),
    updateForm: (id, body) => api.patch(`marketing/formularios/${id}/`, body).then(d),
    removeForm: (id) => api.delete(`marketing/formularios/${id}/`),
    results: (dias = 180) => api.get('marketing/resultados/', { params: { dias } }).then(d),
    // páginas públicas (sem login)
    publicForm: (token) => api.get(`publico/captacao/${token}/`).then(d),
    submitForm: (token, body) => api.post(`publico/captacao/${token}/`, body).then(d),
    publicSurvey: (token) => api.get(`publico/pesquisa/${token}/`).then(d),
    answerSurvey: (token, body) => api.post(`publico/pesquisa/${token}/`, body).then(d),
};

export const courtsApi = {
    suspensions: () => api.get('forense/suspensoes/').then(d),
    directory: () => api.get('forense/tribunais/').then(d),
    // Gestão Cadrius → Jurídico
    staffSuspensions: () => api.get('backoffice/forense/suspensoes/').then(d),
    staffSave: (body, id) => (id ? api.patch(`backoffice/forense/suspensoes/${id}/`, body) : api.post('backoffice/forense/suspensoes/', body)).then(d),
    staffRemove: (id) => api.delete(`backoffice/forense/suspensoes/${id}/`),
    staffCourts: () => api.get('backoffice/forense/tribunais/').then(d),
    staffSaveCourt: (body) => api.post('backoffice/forense/tribunais/', body).then(d),
};

export const customizationApi = {
    list: () => api.get('support/parametrizacoes/').then(d),
    create: (body) => api.post('support/parametrizacoes/', body).then(d),
    decide: (id, decision) => api.post(`support/parametrizacoes/${id}/${decision}/`).then(d),
    staffList: (etapa) => api.get('backoffice/support/parametrizacoes/', { params: etapa ? { etapa } : {} }).then(d),
    staffUpdate: (id, body) => api.patch(`backoffice/support/parametrizacoes/${id}/`, body).then(d),
};

export const complianceApi = { get: () => api.get('automations/conformidade/').then(d) };

export const cnpjApi = { lookup: (cnpj) => api.get(`contacts/cnpj/${String(cnpj).replace(/\D/g, '')}/`).then(d) };

export const STAGES = {
    recebido: { label: 'Recebido', tone: 'blue' }, em_analise: { label: 'Em análise', tone: 'yellow' },
    proposta: { label: 'Proposta (aguardando você)', tone: 'orange' }, aprovado: { label: 'Aprovado', tone: 'green' },
    em_execucao: { label: 'Em execução', tone: 'yellow' }, entregue: { label: 'Entregue', tone: 'green' },
    recusado: { label: 'Não será feito', tone: 'gray' }, cancelado: { label: 'Cancelado', tone: 'gray' },
};
export const STAFF_STAGE_NEXT = {
    recebido: ['em_analise', 'recusado'], em_analise: ['proposta', 'recusado'], proposta: ['em_analise', 'recusado'],
    aprovado: ['em_execucao'], em_execucao: ['entregue'],
};

export const brl = (cents) => (cents == null ? '—' : (Number(cents) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

// matriz de permissões: {modulo: 'nenhum'|'ver'|'editar'} <-> lista de chaves
export function toMatrix(perms, modules) {
    const set = new Set(perms || []);
    return Object.fromEntries(modules.map((m) => [m.chave, set.has(`${m.chave}.editar`) ? 'editar' : set.has(`${m.chave}.ver`) ? 'ver' : 'nenhum']));
}
export function fromMatrix(matrix, extras = []) {
    const out = [];
    Object.entries(matrix).forEach(([mod, level]) => {
        if (level === 'ver' || level === 'editar') out.push(`${mod}.ver`);
        if (level === 'editar') out.push(`${mod}.editar`);
    });
    return [...out, ...extras].sort();
}
