// Regras de automação do escritório e agenda forense (CAD-172). Contrato: automations/api.py e forense/api.py no back
import api from './api';

export const rulesApi = {
    catalog: () => api.get('automations/catalog/').then((r) => r.data),
    templates: () => api.get('automations/templates/').then((r) => r.data),
    list: () => api.get('automations/rules/').then((r) => r.data),
    get: (id) => api.get(`automations/rules/${id}/`).then((r) => r.data),
    create: (body) => api.post('automations/rules/', body).then((r) => r.data),
    fromTemplate: (modelo) => api.post('automations/rules/', { modelo }).then((r) => r.data),
    update: (id, body) => api.patch(`automations/rules/${id}/`, body).then((r) => r.data),
    remove: (id) => api.delete(`automations/rules/${id}/`),
    simulate: (id) => api.post(`automations/rules/${id}/simulate/`).then((r) => r.data),
    enable: (id, ativa) => api.post(`automations/rules/${id}/enable/`, { ativa }).then((r) => r.data),
    runs: (params) => api.get('automations/runs/', { params }).then((r) => r.data),
    shortcut: (id) => api.post(`automations/rules/${id}/atalho/`).then((r) => r.data),      // CAD-226
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
    pulado: ['Pulado (condição do passo)', 'gray'],                               // CAD-230
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
        case 'send_survey': return { type, params: { destinatario: 'cliente', canal: 'melhor', motivo: '', mensagem: '' } };   // CAD-223
        // CAD-230: processamento e Google
        case 'calcular': return { type, params: { nome: '', expressao: '', formato: 'moeda' } };
        case 'tabela': return { type, params: { nome: '', fonte: 'honorarios_em_aberto', do_cliente: false, limite: 50 } };
        case 'google_planilha': return { type, params: { planilha: '', tabela: '', colunas: '' } };
        case 'google_evento': return { type, params: { titulo: '', descricao: '', quando: 'dias_uteis', dias: 1, hora: '09:00', duracao_min: 60 } };
        default: return { type, params: {} };
    }
}

// Ações válidas para o gatilho: envio a contato só quando o evento traz um contato; tarefa "na data do prazo" só se há prazo
export function actionsFor(catalog, triggerId) {
    const trigger = catalog?.gatilhos?.find((g) => g.id === triggerId);
    return (catalog?.acoes || []).filter((a) => (!['send_whatsapp', 'send_email', 'send_message'].includes(a.id) || trigger?.destinatarios?.length)
        && (a.id !== 'send_survey' || trigger?.destinatarios?.includes('cliente')));
}

// CAD-230: variáveis que os passos ANTERIORES (calcular, tabela) oferecem ao passo i
export function producedVars(acoes, upTo) {
    const out = [];
    (acoes || []).slice(0, upTo).forEach((a) => {
        const nome = (a.params?.nome || '').trim();
        if (!nome) return;
        if (a.type === 'calcular') {
            out.push({ chave: `calc.${nome}`, label: `Resultado de "${nome}"` }, { chave: `calc.${nome}_valor`, label: `"${nome}" como número (para comparar)` });
        }
        if (a.type === 'tabela') {
            out.push({ chave: `tabela.${nome}.texto`, label: `Lista "${nome}" (texto)` }, { chave: `tabela.${nome}.quantidade`, label: `Quantas linhas em "${nome}"` },
                { chave: `tabela.${nome}.total`, label: `Total em R$ de "${nome}"` });
        }
    });
    return out;
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
            for (const k of ['dias', 'antecedencia', 'conector_id', 'limite', 'duracao_min']) if (params[k] !== undefined && params[k] !== '') params[k] = Number(params[k]);
            const out = { type: a.type, params };
            if (a.somente_se?.field && a.somente_se?.op) out.somente_se = a.somente_se;   // CAD-230: passo condicional
            return out;
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

export const hasExternal = (rule) => (rule.acoes || []).some((a) => ['send_whatsapp', 'send_email', 'send_message', 'send_survey', 'erp_call', 'team_chat'].includes(a.type));

// CAD-223: configuração numérica dos gatilhos de verificação diária
export const DAILY_CONFIG = {
    opportunity_stale: { key: 'dias', label: 'Dias sem mudar de etapa', min: 3, max: 90, def: 7 },
    case_stale: { key: 'dias', label: 'Dias sem andamento', min: 15, max: 365, def: 60 },
    contract_ending: { key: 'dias', label: 'Dias antes da última parcela', min: 1, max: 60, def: 15 },
    monthly_goal: { key: 'dia', label: 'Dia do mês do aviso (às 9h)', min: 1, max: 28, def: 20 },
};

// Data ISO (AAAA-MM-DD) → DD/MM/AAAA, sem fuso
export const brDate = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '—');

// CAD-226: como ligar o atalho em cada aparelho (o link sai em ShortcutPanel)
export const SHORTCUT_GUIDES = {
    apple: { label: 'Apple Watch e iPhone', steps: [
        'No iPhone, abra o app Atalhos e toque em + para criar um atalho (ex.: "Cheguei ao fórum").',
        'Opcional: adicione "Ditar texto" para falar o recado.',
        'Adicione "Obter conteúdo de URL", cole o link, método POST, corpo JSON com o campo texto (o texto ditado) e origem = relógio.',
        'Em detalhes do atalho, ligue "Mostrar no Apple Watch". Toque no relógio ou peça "E aí Siri, cheguei ao fórum".',
    ] },
    android: { label: 'Android e Wear OS', steps: [
        'Instale o app gratuito "HTTP Shortcuts" (ou use o Tasker).',
        'Crie um atalho: método POST, cole o link, corpo JSON {"texto": "…", "origem": "relógio"}.',
        'Ponha o atalho na tela inicial ou no bloco (tile) do relógio Wear OS.',
        'Para falar o recado, use a opção de pedir texto antes de enviar.',
    ] },
    voz: { label: 'Alexa, Google e botões', steps: [
        'Crie um applet no IFTTT (ou automação no Home Assistant): "Se eu disser… à Alexa/Google".',
        'Ação: Webhooks → Make a web request, método POST, cole o link, tipo application/json.',
        'Botões inteligentes (Flic, Shelly) também chamam o link.',
        'Dica: use regras que avisam a equipe ou criam tarefa. O atalho nunca manda mensagem a cliente.',
    ] },
};
