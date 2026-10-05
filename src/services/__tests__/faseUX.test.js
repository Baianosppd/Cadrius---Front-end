import { describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({ default: {} }));

import { nextPref, resolveTheme } from '../theme';
import { computeSteps, greeting, STEPS } from '../onboarding';
import { monthGrid, CHANNEL_COLOR } from '../marketing';
import { envHost, ENVIRONMENTS } from '../environment';

describe('tema', () => {
    it('resolve o tema efetivo e alterna na ordem claro → escuro → automático', () => {
        expect(resolveTheme('dark', false)).toBe('dark');
        expect(resolveTheme('light', true)).toBe('light');
        expect(resolveTheme('system', true)).toBe('dark');
        expect(resolveTheme('system', false)).toBe('light');
        expect([nextPref('light'), nextPref('dark'), nextPref('system')]).toEqual(['dark', 'system', 'light']);
    });
});

describe('primeiros passos', () => {
    it('conta o que já foi feito a partir das respostas das APIs', () => {
        const r = computeSteps({ oabs: [{ id: 1 }], contacts: { total: 3 }, docs: 0, rules: [{ ativa: false }], profile: { cidade: 'Recife' }, connections: [] });
        expect(r.total).toBe(STEPS.length);
        expect(r.steps.filter((s) => s.done).map((s) => s.key)).toEqual(['oab', 'contatos', 'perfil']);
        expect(r.pct).toBe(50);
        expect(computeSteps().done).toBe(0);
    });
    it('saudação pelo horário', () => {
        expect(greeting(new Date(2026, 0, 1, 9))).toBe('Bom dia');
        expect(greeting(new Date(2026, 0, 1, 14))).toBe('Boa tarde');
        expect(greeting(new Date(2026, 0, 1, 21))).toBe('Boa noite');
    });
});

describe('calendário editorial', () => {
    it('monta as semanas do mês e coloca cada conteúdo no seu dia', () => {
        const items = [{ id: 1, canal: 'instagram', agendado_para: new Date(2026, 9, 15, 10).toISOString() }];
        const weeks = monthGrid(2026, 9, items);
        const cells = weeks.flat();
        expect(cells[0].date.getDay()).toBe(0);                       // começa no domingo
        expect(cells.filter((c) => c.inMonth)).toHaveLength(31);
        expect(cells.find((c) => c.inMonth && c.day === 15).items[0].id).toBe(1);
        expect(CHANNEL_COLOR.instagram).toMatch(/^#/);
    });
});

describe('bases', () => {
    it('mostra o endereço de cada base', () => {
        expect(envHost('producao')).toBe(new URL(ENVIRONMENTS.producao.url).host);
        expect(ENVIRONMENTS.teste.description).toContain('homologação');
    });
});
