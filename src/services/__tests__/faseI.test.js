import { describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({ default: {} }));

import { STAFF_STAGE_NEXT, brl, fromMatrix, toMatrix } from '../cad223';
import { buildStaffBody } from '../backoffice';
import { birthdayToInput, contactBody, EMPTY_CONTACT } from '../contacts';
import { DAILY_CONFIG, actionsFor, emptyAction } from '../rules';
import { visibleMenu } from '../../layouts/appMenu';

const MODS = [{ chave: 'contatos' }, { chave: 'financeiro' }, { chave: 'marketing' }];

describe('CAD-223: grupos de acesso', () => {
    it('matriz ver/editar ida e volta, com extras', () => {
        const m = toMatrix(['contatos.ver', 'contatos.editar', 'financeiro.ver'], MODS);
        expect(m).toEqual({ contatos: 'editar', financeiro: 'ver', marketing: 'nenhum' });
        expect(fromMatrix(m, ['marketing.aprovar'])).toEqual(['contatos.editar', 'contatos.ver', 'financeiro.ver', 'marketing.aprovar']);
    });

    it('menu esconde o que o grupo não libera; sem grupo mostra tudo', () => {
        const items = (perms) => visibleMenu(false, { perms }).flatMap((s) => s.items.map((i) => i.to));
        const all = items(null);
        expect(all).toContain('/financas');
        const limited = items(['contatos.ver', 'tarefas.ver']);
        expect(limited).toContain('/contatos');
        expect(limited).not.toContain('/financas');
        expect(limited).not.toContain('/marketing');
        expect(limited).toContain('/dashboard');                       // itens sem módulo continuam
    });

    it('equipe Cadrius: área só de consulta conta como área', () => {
        expect(buildStaffBody({ email: 'a@b.com', areas: [], consulta: ['fiscal'], reason: 'Contratação nova' }).body.consulta).toEqual(['fiscal']);
        expect(buildStaffBody({ email: 'a@b.com', areas: ['ti'], consulta: ['ti', 'juridico'], reason: 'Contratação nova' }).body.consulta).toEqual(['juridico']);
    });
});

describe('CAD-223: automação, contatos e suporte', () => {
    it('pedir avaliação só em gatilho com cliente; configs diárias', () => {
        const catalog = { gatilhos: [{ id: 'monthly_goal', destinatarios: [] }, { id: 'contract_ending', destinatarios: ['cliente'] }],
            acoes: [{ id: 'notify' }, { id: 'send_survey' }] };
        expect(actionsFor(catalog, 'monthly_goal').map((a) => a.id)).toEqual(['notify']);
        expect(actionsFor(catalog, 'contract_ending').map((a) => a.id)).toEqual(['notify', 'send_survey']);
        expect(emptyAction('send_survey').params.canal).toBe('melhor');
        expect(DAILY_CONFIG.case_stale.min).toBe(15);
    });

    it('aniversário: MM-DD vira DD/MM e vai no corpo', () => {
        expect(birthdayToInput('03-06')).toBe('06/03');
        expect(contactBody({ ...EMPTY_CONTACT, name: 'Ana', birthday: ' 06/03 ' }).birthday).toBe('06/03');
    });

    it('etapas da parametrização e moeda', () => {
        expect(STAFF_STAGE_NEXT.aprovado).toEqual(['em_execucao']);
        expect(STAFF_STAGE_NEXT.entregue).toBeUndefined();
        expect(brl(123456)).toMatch(/1\.234,56/);
        expect(brl(null)).toBe('—');
    });
});
