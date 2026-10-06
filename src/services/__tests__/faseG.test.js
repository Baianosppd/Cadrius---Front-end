import { describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({ default: {} }));

import { parseBlocks, parseInline, WRITE_ACTIONS } from '../assistant';
import { levelOf, niceMax, scoreLevel } from '../cyber';
import { passwordChecks } from '../passwordPolicy';

describe('assistente: texto da IA sem HTML', () => {
    it('separa títulos, listas e parágrafos', () => {
        const blocks = parseBlocks('# Prazos\n- Maria: 10/03\n- João: 12/03\n\n1. Ligar\n2. Protocolar\nFim.');
        expect(blocks.map((b) => b.type)).toEqual(['heading', 'list', 'list', 'p']);
        expect(blocks[1].items).toEqual(['Maria: 10/03', 'João: 12/03']);
        expect(blocks[2].ordered).toBe(true);
    });
    it('negrito, links internos e rotas soltas viram links; HTML e links externos ficam como texto', () => {
        const parts = parseInline('Veja **urgente** em [Maria](/contatos?abrir=12) ou /publicacoes e <img src=x onerror=alert(1)> [x](https://evil.com)');
        expect(parts.filter((p) => p.type === 'bold')[0].text).toBe('urgente');
        expect(parts.filter((p) => p.type === 'link').map((p) => p.to)).toEqual(['/contatos?abrir=12', '/publicacoes']);
        expect(parts.map((p) => p.text).join('')).toContain('<img src=x onerror=alert(1)>');
    });
    it('oferece extrair dados e as reescritas', () => {
        expect(WRITE_ACTIONS.map((w) => w.key)).toEqual(expect.arrayContaining(['corrigir', 'formal', 'simples', 'resumir', 'extrair']));
    });
});

describe('cibersegurança: regras dos gráficos', () => {
    it('escala do eixo, gravidade do medidor e nota', () => {
        expect([niceMax(0), niceMax(3), niceMax(7), niceMax(42), niceMax(130)]).toEqual([4, 4, 10, 50, 200]);
        expect([levelOf(50), levelOf(75), levelOf(90)]).toEqual(['ok', 'warn', 'crit']);
        expect([scoreLevel(95).label, scoreLevel(70).label, scoreLevel(30).label]).toEqual(['Saudável', 'Atenção', 'Crítico']);
    });
});

describe('troca obrigatória de senha', () => {
    it('confere tamanho, letras e números, diferente da temporária e sem o e-mail', () => {
        const ok = (pwd) => passwordChecks(pwd, { previous: 'Temp#2030abcDEF1', email: 'maria@x.com' }).every((c) => c.ok);
        expect(ok('Nova-Senha-2030')).toBe(true);
        expect(ok('curta1')).toBe(false);
        expect(ok('Temp#2030abcDEF1')).toBe(false);
        expect(ok('maria-senha-2030')).toBe(false);
        expect(ok('somenteletrasaqui')).toBe(false);
    });
});

describe('CAD-222', () => {
    it('menu do advogado autônomo: sem textos de equipe e "Equipe" some com 1 usuário', async () => {
        const { visibleMenu } = await import('../../layouts/appMenu');
        const labels = (opts) => visibleMenu(true, opts).flatMap((s) => s.items.map((i) => i.label));
        expect(labels()).toContain('Equipe');
        expect(labels({ solo: true, maxUsers: 3 })).toContain('Convidar alguém');
        expect(labels({ solo: true, maxUsers: 1 })).not.toContain('Equipe');
        expect(labels()).toContain('Plugins (Claude, ChatGPT)');
    });
    it('primeiros passos com linguagem de autônomo', async () => {
        const { computeSteps } = await import('../onboarding');
        expect(computeSteps({}, true).steps.find((s) => s.key === 'perfil').label).toMatch(/perfil profissional/);
        expect(computeSteps({}, false).steps.find((s) => s.key === 'perfil').label).toMatch(/escritório/);
    });
    it('passo a passo do conector por app', async () => {
        const { connectorSteps } = await import('../assistant');
        const urls = { url: 'https://api/mcp/', urlWithToken: 'https://api/mcp/cdr_x/', token: 'cdr_x' };
        expect(connectorSteps('claude', urls)).toContain('https://api/mcp/cdr_x/');
        expect(connectorSteps('code', urls).join(' ')).toContain('Authorization: Bearer cdr_x');
        expect(connectorSteps('chatgpt', urls).join(' ')).toContain('modo desenvolvedor');
    });
    it('editor de regras: aviso pelo melhor canal e gatilhos com data', async () => {
        const { emptyAction, triggerHasDeadline, hasExternal } = await import('../rules');
        expect(emptyAction('send_message', ['cliente']).params).toEqual({ destinatario: 'cliente', canal: 'melhor', assunto: '', mensagem: '' });
        expect(triggerHasDeadline('calendar_event')).toBe(true);
        expect(hasExternal({ acoes: [{ type: 'send_message' }] })).toBe(true);
    });
});
