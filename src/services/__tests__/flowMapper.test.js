import { describe, it, expect } from 'vitest';
import { flowToWorkflow, validateFlow, workflowToFlow, isSupported } from '../flowMapper';

const node = (id, type, subtype, config = {}) => ({ id, data: { type, subtype, label: subtype, config } });
const edge = (source, target) => ({ id: `${source}-${target}`, source, target });

describe('flowMapper', () => {
    it('só aceita blocos que o servidor executa', () => {
        expect(isSupported('send_whatsapp')).toBe(true);
        expect(isSupported('webhook')).toBe(true);
        expect(isSupported('send_sms')).toBe(false);
    });

    it('valida: exatamente 1 gatilho, ao menos 1 ação e blocos suportados', () => {
        expect(validateFlow([], [])[0]).toMatch(/1 gatilho/);
        const t = node('t', 'trigger', 'whatsapp');
        expect(validateFlow([t], []).join(' ')).toMatch(/ao menos 1 ação/);
        const bad = node('a', 'action', 'send_sms');
        expect(validateFlow([t, bad], [edge('t', 'a')]).join(' ')).toMatch(/Ainda não disponíveis/);
    });

    it('exige texto no WhatsApp e URL https no webhook', () => {
        const t = node('t', 'trigger', 'whatsapp');
        const w = node('w', 'action', 'send_whatsapp', { text: '  ' });
        const h = node('h', 'action', 'webhook', { url: 'http://x.com' });
        const errors = validateFlow([t, w, h], [edge('t', 'w'), edge('w', 'h')]);
        expect(errors.join(' ')).toMatch(/texto da mensagem/);
        expect(errors.join(' ')).toMatch(/https/);
    });

    it('detecta ação solta (sem ligação com o gatilho)', () => {
        const t = node('t', 'trigger', 'whatsapp');
        const a = node('a', 'action', 'send_whatsapp', { text: 'oi' });
        expect(validateFlow([t, a], []).join(' ')).toMatch(/sem ligação/);
    });

    it('gera o contrato do back, com as ações na ordem das arestas', () => {
        const nodes = [
            node('t', 'trigger', 'webhook_in'),
            node('b', 'action', 'webhook', { url: 'https://x.com/h', payload: '{"a":1}' }),
            node('a', 'action', 'send_whatsapp', { text: 'Olá {{nome}}' }),
        ];
        const wf = flowToWorkflow({ nodes, edges: [edge('t', 'a'), edge('a', 'b')], title: 'Meu fluxo', active: true, connectionId: 7 });
        expect(wf.trigger).toEqual({ connection: 7, event_type: 'Webhook Externo', payload_mapping: {} });
        expect(wf.actions.map((x) => x.action_type)).toEqual(['WHATSAPP_EVOLUTION', 'WEBHOOK']);
        expect(JSON.parse(wf.actions[0].payload_template)).toEqual({ number: '{{telefone}}', text: 'Olá {{nome}}' });
        expect(wf.actions[1]).toMatchObject({ endpoint_url: 'https://x.com/h', method: 'POST' });
        expect(wf.is_active).toBe(true);
    });

    it('ida e volta: workflow do back → nós → workflow', () => {
        const wf = {
            trigger: { event_type: 'message_received' },
            actions: [{ action_type: 'WHATSAPP_EVOLUTION', payload_template: '{"number":"{{telefone}}","text":"Oi"}' }],
        };
        const { nodes, edges } = workflowToFlow(wf);
        expect(nodes.map((n) => n.data.subtype)).toEqual(['whatsapp', 'send_whatsapp']);
        expect(edges).toHaveLength(1);
        expect(validateFlow(nodes, edges)).toEqual([]);
        const back = flowToWorkflow({ nodes, edges, title: 'x', active: false, connectionId: 1 });
        expect(JSON.parse(back.actions[0].payload_template).text).toBe('Oi');
    });
});
