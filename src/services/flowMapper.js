// Tradução entre o canvas (React Flow: nós/arestas) e o contrato do back (Workflow: trigger + actions[]).
// O back executa: gatilhos (WhatsApp, e-mail, webhook externo) e ações WHATSAPP_EVOLUTION, EMAIL_SMTP (CAD-224) e WEBHOOK.

export const SUPPORTED = {
    // gatilhos → event_type
    whatsapp: { kind: 'trigger', event_type: 'message_received' },
    email: { kind: 'trigger', event_type: 'novo_email' },
    webhook_in: { kind: 'trigger', event_type: 'Webhook Externo' },
    // ações → action_type
    send_whatsapp: { kind: 'action', action_type: 'WHATSAPP_EVOLUTION' },
    send_email: { kind: 'action', action_type: 'EMAIL_SMTP' },
    webhook: { kind: 'action', action_type: 'WEBHOOK' },
};

export const isSupported = (subtype) => subtype in SUPPORTED;

const ACTION_SUBTYPE = Object.fromEntries(
    Object.entries(SUPPORTED).filter(([, v]) => v.kind === 'action').map(([k, v]) => [v.action_type, k]),
);
const TRIGGER_SUBTYPE = Object.fromEntries(
    Object.entries(SUPPORTED).filter(([, v]) => v.kind === 'trigger').map(([k, v]) => [v.event_type, k]),
);

export const NODE_META = {
    whatsapp: { label: 'WhatsApp', description: 'Mensagem recebida', type: 'trigger' },
    email: { label: 'E-mail', description: 'E-mail recebido', type: 'trigger' },
    webhook_in: { label: 'Webhook externo', description: 'Recebe eventos de outros sistemas', type: 'trigger' },
    send_whatsapp: { label: 'Enviar WhatsApp', description: 'Enviar mensagem', type: 'action' },
    send_email: { label: 'Enviar E-mail', description: 'Equipe ou cliente que autorizou', type: 'action' },
    webhook: { label: 'Chamar webhook', description: 'Enviar dados a um sistema externo', type: 'action' },
};

// Ações em ordem de execução: segue as arestas a partir do gatilho (sem repetir nós)
function orderedActions(nodes, edges, triggerId) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const order = [];
    const seen = new Set([triggerId]);
    const queue = [triggerId];
    while (queue.length) {
        const current = queue.shift();
        for (const e of edges.filter((x) => x.source === current)) {
            if (seen.has(e.target)) continue;
            seen.add(e.target);
            const node = byId.get(e.target);
            if (node) { order.push(node); queue.push(node.id); }
        }
    }
    return order;
}

export function validateFlow(nodes, edges) {
    const errors = [];
    const triggers = nodes.filter((n) => n.data?.type === 'trigger');
    const unsupported = nodes.filter((n) => !isSupported(n.data?.subtype));
    if (triggers.length !== 1) errors.push('O fluxo precisa ter exatamente 1 gatilho.');
    if (unsupported.length) errors.push(`Ainda não disponíveis no servidor: ${unsupported.map((n) => n.data?.label).join(', ')}. Remova-os para salvar.`);
    if (triggers.length === 1) {
        const chain = orderedActions(nodes, edges, triggers[0].id).filter((n) => n.data?.type === 'action');
        const actions = nodes.filter((n) => n.data?.type === 'action');
        if (actions.length === 0) errors.push('Adicione ao menos 1 ação.');
        else if (chain.length < actions.length) errors.push('Há ações sem ligação com o gatilho. Conecte-as ao fluxo.');
        for (const n of chain) {
            const c = n.data.config || {};
            if (n.data.subtype === 'send_whatsapp' && !(c.text || '').trim()) errors.push('“Enviar WhatsApp”: escreva o texto da mensagem.');
            if (n.data.subtype === 'send_email' && !(c.body || '').trim()) errors.push('“Enviar E-mail”: escreva a mensagem.');
            if (n.data.subtype === 'webhook' && !/^https:\/\//i.test(c.url || '')) errors.push('“Chamar webhook”: informe uma URL https://.');
        }
    }
    return errors;
}

export function flowToWorkflow({ nodes, edges, title, active, connectionId }) {
    const trigger = nodes.find((n) => n.data?.type === 'trigger');
    const actionNodes = orderedActions(nodes, edges, trigger.id).filter((n) => n.data?.type === 'action');
    return {
        name: (title || 'Novo Fluxo').slice(0, 255),
        description: '',
        is_active: !!active,
        trigger: {
            connection: connectionId,
            event_type: SUPPORTED[trigger.data.subtype].event_type,
            payload_mapping: {},
        },
        actions: actionNodes.map((n) => {
            const c = n.data.config || {};
            if (n.data.subtype === 'send_whatsapp') {
                return {
                    action_type: 'WHATSAPP_EVOLUTION',
                    payload_template: JSON.stringify({ number: c.number || '{{telefone}}', text: c.text }),
                };
            }
            if (n.data.subtype === 'send_email') {
                return {
                    action_type: 'EMAIL_SMTP',
                    payload_template: JSON.stringify({ to: c.to || '{{email}}', subject: c.subject || '', body: c.body }),
                };
            }
            return {
                action_type: 'WEBHOOK', endpoint_url: c.url, method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                payload_template: c.payload?.trim() || '{}',
            };
        }),
    };
}

// Workflow do back → nós/arestas (posições calculadas depois pelo auto-layout)
export function workflowToFlow(workflow) {
    const triggerSub = TRIGGER_SUBTYPE[workflow.trigger?.event_type] || 'webhook_in';
    const nodes = [{
        id: 'trigger_0', type: 'custom', position: { x: 0, y: 0 },
        data: { ...NODE_META[triggerSub], subtype: triggerSub, config: {} },
    }];
    const edges = [];
    let prev = 'trigger_0';
    (workflow.actions || []).forEach((a, i) => {
        const sub = ACTION_SUBTYPE[a.action_type] || 'webhook';
        let config = {};
        try {
            const t = JSON.parse(a.payload_template || '{}');
            if (sub === 'send_whatsapp') config = { number: t.number === '{{telefone}}' ? '' : t.number, text: t.text };
            else if (sub === 'send_email') config = { to: t.to === '{{email}}' ? '' : t.to, subject: t.subject, body: t.body };
            else config = { url: a.endpoint_url, payload: a.payload_template };
        } catch { config = { url: a.endpoint_url, payload: a.payload_template }; }
        const id = `action_${i}`;
        nodes.push({ id, type: 'custom', position: { x: 0, y: 0 }, data: { ...NODE_META[sub], subtype: sub, config } });
        edges.push({ id: `e_${prev}_${id}`, source: prev, target: id, animated: true });
        prev = id;
    });
    return { nodes, edges };
}
