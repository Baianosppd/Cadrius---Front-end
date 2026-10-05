import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({ default: {} }));

import { ACTIONS, filterItems, norm, score, staticItems } from '../search';
import { TOURS, markSeen, shouldShow, tourFor } from '../tour';

describe('busca global (Ctrl+K)', () => {
    it('ignora acento e caixa', () => {
        expect(norm('  Publicações ')).toBe('publicacoes');
    });
    it('respeita o perfil: Auditoria só para dono/admin', () => {
        const labels = (m) => staticItems(m).map((i) => i.label);
        expect(labels(false)).not.toContain('Auditoria');
        expect(labels(true)).toContain('Auditoria');
        expect(staticItems(false).filter((i) => i.group === 'Ações rápidas')).toHaveLength(ACTIONS.length);
    });
    it('acha telas e ações sem acento e pelas palavras-chave, com o início do nome primeiro', () => {
        const items = staticItems(true);
        expect(filterItems(items, 'publica')[0].label).toBe('Publicações');
        expect(filterItems(items, 'peticao').map((i) => i.label)).toContain('Nova minuta');
        expect(filterItems(items, 'xyzw')).toEqual([]);
        expect(score({ label: 'Minutas' }, 'min')).toBeGreaterThan(score({ label: 'Nova minuta' }, 'min'));
    });
});

describe('tour da primeira visita', () => {
    beforeEach(() => {
        const store = {};
        globalThis.window = { localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } } };
    });
    it('cada tour tem de 1 a 3 passos', () => {
        for (const t of Object.values(TOURS)) expect(t.steps.length).toBeGreaterThan(0);
        expect(Object.values(TOURS).every((t) => t.steps.length <= 3)).toBe(true);
    });
    it('aparece uma vez por módulo e não em telas sem tour', () => {
        expect(tourFor('/minutas/').key).toBe('/minutas');
        expect(tourFor('/minutas/12')).toBeNull();
        expect(shouldShow('/publicacoes').title).toBe('Publicações');
        markSeen('/publicacoes');
        expect(shouldShow('/publicacoes')).toBeNull();
        expect(shouldShow('/marketing')).not.toBeNull();
    });
});
