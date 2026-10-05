import { describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({ default: {} }));

import { actionsFor, brDate, describeRule, emptyAction, hasExternal, insertVariable, ruleBody, ruleToForm, triggerHasDeadline } from '../rules';

const catalog = {
    gatilhos: [
        { id: 'case_movement', label: 'Andamento novo no processo', destinatarios: ['cliente'] },
        { id: 'deadline_soon', label: 'Prazo chegando', destinatarios: [] },
    ],
    acoes: [
        { id: 'create_task', label: 'Criar tarefa' }, { id: 'notify', label: 'Avisar a equipe (sino)' },
        { id: 'send_whatsapp', label: 'Enviar WhatsApp ao contato' }, { id: 'send_email', label: 'Enviar e-mail ao contato' },
        { id: 'erp_call', label: 'Chamar o ERP' },
    ],
};

describe('regras de automação (CAD-172)', () => {
    it('insere variável no cursor ou no fim', () => {
        expect(insertVariable('Olá !', 'cliente.nome', 4)).toBe('Olá {{cliente.nome}}!');
        expect(insertVariable('Olá', 'x')).toBe('Olá{{x}}');
        expect(insertVariable('ab', 'x', 99)).toBe('ab{{x}}');
    });

    it('só oferece envio a contato quando o gatilho traz um contato', () => {
        expect(actionsFor(catalog, 'case_movement').map((a) => a.id)).toContain('send_whatsapp');
        expect(actionsFor(catalog, 'deadline_soon').map((a) => a.id)).not.toContain('send_email');
        expect(triggerHasDeadline('deadline_soon')).toBe(true);
        expect(triggerHasDeadline('case_movement')).toBe(false);
    });

    it('monta o corpo da API convertendo números e limpando condições vazias', () => {
        const form = {
            ...ruleToForm(null), nome: '  Aviso ', gatilho: 'case_movement',
            condicoes: [{ field: 'processo.tribunal', op: 'eq', value: 'tjsp' }, { field: '', op: '' }],
            acoes: [emptyAction('create_task'), { ...emptyAction('send_whatsapp', ['cliente']), params: { destinatario: 'cliente', mensagem: 'oi' } }],
            exige_aprovacao: false,
        };
        form.acoes[0].params.dias = '2';
        const body = ruleBody(form);
        expect(body.name).toBe('Aviso');
        expect(body.conditions).toHaveLength(1);
        expect(body.actions[0].params.dias).toBe(2);
        expect(body.actions[1].params.destinatario).toBe('cliente');
        expect(body.require_approval).toBe(false);
    });

    it('descreve a regra e detecta envio externo', () => {
        const rule = { gatilho: 'case_movement', acoes: [{ type: 'create_task' }, { type: 'send_whatsapp' }] };
        expect(describeRule(rule, catalog)).toBe('Quando: Andamento novo no processo → Criar tarefa, Enviar WhatsApp ao contato');
        expect(hasExternal(rule)).toBe(true);
        expect(hasExternal({ acoes: [{ type: 'notify' }] })).toBe(false);
    });

    it('formata data ISO sem fuso', () => {
        expect(brDate('2026-03-16')).toBe('16/03/2026');
        expect(brDate(null)).toBe('—');
    });
});
