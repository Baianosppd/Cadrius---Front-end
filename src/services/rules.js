// Regras de automação do escritório e agenda forense (CAD-172). Contrato: automations/api.py e forense/api.py no back
import api from './api';

export const rulesApi = {
    catalog: () => api.get('automations/catalog/').then((r) => r.data),
    templates: () => api.get('automations/templates/').then((r) => r.data),
    list: () => api.get('automations/rules/').then((r) => r.data),
    create: (body) => api.post('automations/rules/', body).then((r) => r.data),
    fromTemplate: (modelo) => api.post('automations/rules/', { modelo }).then((r) => r.data),
    update: (id, body) => api.patch(`automations/rules/${id}/`, body).then((r) => r.data),
    remove: (id) => api.delete(`automations/rules/${id}/`),
    simulate: (id) => api.post(`automations/rules/${id}/simulate/`).then((r) => r.data),
    enable: (id, ativa) => api.post(`automations/rules/${id}/enable/`, { ativa }).then((r) => r.data),
    runs: (params) => api.get('automations/runs/', { params }).then((r) => r.data),
    approve: (id) => api.post(`automations/runs/${id}/approve/`).then((r) => r.data),
    reject: (id, motivo) => api.post(`automations/runs/${id}/reject/`, { motivo }).then((r) => r.data),
};

export const forenseApi = {
    prazo: (params) => api.get('forense/prazo/', { params }).then((r) => r.data),
    feriados: () => api.get('forense/feriados/').then((r) => r.data),
    addFeriado: (body) => api.post('forense/feriados/', body).then((r) => r.data),
    removeFeriado: (id) => api.delete(`forense/feriados/${id}/`),
};

export const casesApi = {
    list: () => api.get('research/cases/').then((r) => r.data),
    add: (body) => api.post('research/cases/', body).then((r) => r.data),
    update: (id, body) => api.patch(`research/cases/${id}/`, body).then((r) => r.data),
    checkNow: (id) => api.post(`research/cases/${id}/check-now/`).then((r) => r.data),
    remove: (id) => api.delete(`research/cases/${id}/`),
};

export const RUN_STATUS = {
    success: ['Concluída', 'green'], partial: ['Com falhas', 'yellow'], failed: ['Falhou', 'red'], skipped: ['Condições não atendidas', 'gray'],
    pending_approval: ['Aguardando aprovação', 'yellow'], rejected: ['Recusada', 'gray'], expired: ['Expirada', 'gray'],
    running: ['Executando', 'blue'], scheduled: ['Agendada (horário comercial)', 'blue'],
};

export const STEP_STATUS = {
    planejado: ['Vai executar', 'blue'], feito: ['Feito', 'green'], erro: ['Erro', 'red'], bloqueado: ['Bloqueado', 'red'],
    aguardando: ['Aguardando aprovação', 'yellow'], recusado: ['Recusado', 'gray'], expirado: ['Expirado', 'gray'],
    agendado: ['Agendado para o horário comercial', 'blue'],
};

// Parâmetros iniciais de cada ação no editor
export function emptyAction(type, destinatarios = []) {
    switch (type) {
        case 'create_task': return { type, params: { titulo: '', descricao: '', prioridade: 'media', quando: 'dias_uteis', dias: 1 } };
        case 'notify': return { type, params: { titulo: '', mensagem: '' } };
        case 'send_whatsapp': return { type, params: { destinatario: destinatarios[0] || '', mensagem: '' } };
        case 'send_email': return { type, params: { destinatario: destinatarios[0] || '', assunto: '', mensagem: '' } };
        case 'erp_call': return { type, params: { conector_id: '', operacao: '', dados: {} } };
        case 'team_chat': return { type, params: { canal: 'slack', mensagem: '' } };
        case 'send_message': return { type, params: { destinatario: destinatarios[0] || '', canal: 'melhor', assunto: '', mensagem: '' } };
        default: return { type, params: {} };
    }
}

// Ações válidas para o gatilho: envio a contato só quando o evento traz um contato; tarefa "na data do prazo" só se há prazo
export function actionsFor(catalog, triggerId) {
    const trigger = catalog?.gatilhos?.find((g) => g.id === triggerId);
    return (catalog?.acoes || []).filter((a) => !['send_whatsapp', 'send_email', 'send_message'].includes(a.id) || trigger?.destinatarios?.length);
}

export const triggerHasDeadline = (triggerId) => ['document_confirmed', 'deadline_soon', 'publication_new', 'calendar_event', 'email_received',
    'task_overdue'].includes(triggerId);

// Corpo da API a partir do formulário do editor
export function ruleBody(form) {
    return {
        name: form.nome.trim(), description: (form.descricao || '').trim(), trigger: form.gatilho,
        trigger_config: form.gatilho_config || {}, require_approval: form.exige_aprovacao !== false,
        conditions: (form.condicoes || []).filter((c) => c.field && c.op).map((c) => ({ field: c.field, op: c.op, value: c.value ?? '' })),
        actions: (form.acoes || []).map((a) => {
            const params = { ...a.params };
            for (const k of ['dias', 'antecedencia', 'conector_id']) if (params[k] !== undefined && params[k] !== '') params[k] = Number(params[k]);
            return { type: a.type, params };
        }),
    };
}

export function ruleToForm(rule) {
    return {
        id: rule?.id, nome: rule?.nome || '', descricao: rule?.descricao || '', gatilho: rule?.gatilho || 'case_movement',
        gatilho_config: rule?.gatilho_config || {}, condicoes: rule?.condicoes || [], acoes: rule?.acoes || [],
        exige_aprovacao: rule?.exige_aprovacao !== false,
    };
}

// Insere "{{variavel}}" na posição do cursor (ou no fim)
export function insertVariable(text, key, pos) {
    const tag = `{{${key}}}`;
    const at = Number.isInteger(pos) ? Math.min(Math.max(pos, 0), text.length) : text.length;
    return text.slice(0, at) + tag + text.slice(at);
}

// Resumo legível: "Quando Andamento novo → Criar tarefa, Enviar WhatsApp"
export function describeRule(rule, catalog) {
    const g = catalog?.gatilhos?.find((x) => x.id === rule.gatilho);
    const labels = (rule.acoes || []).map((a) => catalog?.acoes?.find((x) => x.id === a.type)?.label || a.type);
    return `Quando: ${g?.label || rule.gatilho_label || rule.gatilho} → ${labels.join(', ') || 'nenhuma ação'}`;
}

export const hasExternal = (rule) => (rule.acoes || []).some((a) => ['send_whatsapp', 'send_email', 'send_message', 'erp_call', 'team_chat'].includes(a.type));

// Data ISO (AAAA-MM-DD) → DD/MM/AAAA, sem fuso
export const brDate = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '—');
