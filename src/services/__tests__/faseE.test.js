import { describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({ default: {} }));

import { currentEnv, switchUrl } from '../environment';
import { groupByCategory, missingFields } from '../integrations';
import { groupByDay, parseHashtags, toLocalInput } from '../marketing';
import { formatMinutes } from '../brain';
import { visibleMenu } from '../../layouts/appMenu';

describe('ambiente (login produção ↔ teste)', () => {
    it('detecta pelo endereço', () => {
        expect(currentEnv('app-teste.cadrius.ia.br')).toBe('teste');
        expect(currentEnv('app.cadrius.ia.br')).toBe('producao');
        expect(currentEnv('localhost')).toBe('local');
    });
    it('leva só o e-mail para o outro ambiente', () => {
        const url = switchUrl('teste', 'ana@x.com');
        expect(url).toBe('https://app-teste.cadrius.ia.br/?email=ana%40x.com');
        expect(switchUrl('producao')).toBe('https://app.cadrius.ia.br/');
        expect(switchUrl('marte')).toBeNull();
    });
});

describe('integrações', () => {
    const catalog = {
        categorias: ['Comunicação', 'Financeiro'],
        apps: [
            { app: 'SMTP', label: 'E-mail', categoria: 'Comunicação', uso: 'e-mails', campos: [{ key: 'host', label: 'Servidor', required: true }, { key: 'x', label: 'X' }] },
            { app: 'ASAAS', label: 'Asaas', categoria: 'Financeiro', uso: 'boleto e pix', campos: [] },
        ],
    };
    it('campos obrigatórios', () => {
        expect(missingFields(catalog.apps[0], {})).toEqual(['Servidor']);
        expect(missingFields(catalog.apps[0], { host: ' smtp ' })).toEqual([]);
    });
    it('agrupa por categoria e busca', () => {
        expect(groupByCategory(catalog).map((g) => g.categoria)).toEqual(['Comunicação', 'Financeiro']);
        expect(groupByCategory(catalog, 'boleto').map((g) => g.apps[0].app)).toEqual(['ASAAS']);
        expect(groupByCategory(catalog, 'nada')).toEqual([]);
    });
});

describe('marketing', () => {
    it('hashtags', () => {
        expect(parseHashtags('#direito, cdc ; #direito  #lgpd')).toEqual(['direito', 'cdc', 'lgpd']);
        expect(parseHashtags('')).toEqual([]);
    });
    it('agenda por dia com "Sem data" no fim', () => {
        const groups = groupByDay([{ id: 1, agendado_para: null }, { id: 2, agendado_para: '2026-03-10T12:00:00Z' }]);
        expect(groups[groups.length - 1][0]).toBe('Sem data');
        expect(groups).toHaveLength(2);
    });
    it('datetime-local', () => {
        expect(toLocalInput('')).toBe('');
        expect(toLocalInput('2026-03-10T12:30:00')).toBe('2026-03-10T12:30');
    });
});

describe('aprendizado e menu', () => {
    it('minutos economizados', () => {
        expect(formatMinutes(45)).toBe('45 min');
        expect(formatMinutes(120)).toBe('2 h');
        expect(formatMinutes(135)).toBe('2 h 15 min');
    });
    it('auditoria só para dono/admin', () => {
        const flat = (m) => m.flatMap((s) => s.items.map((i) => i.to));
        expect(flat(visibleMenu(false))).not.toContain('/auditoria');
        expect(flat(visibleMenu(true))).toContain('/auditoria');
        expect(flat(visibleMenu(false))).toContain('/marketing');
    });
});

describe('regras aprendidas (vocabulário do escritório)', () => {
    it('explica a evidência conforme o tipo da regra', async () => {
        const { ruleEvidence, RULE_KIND } = await import('../brain');
        expect(ruleEvidence({ kind: 'term', evidence: 3 })).toBe('A equipe fez essa troca em 3 textos revisados.');
        expect(ruleEvidence({ kind: 'field_correction', evidence: 1 })).toBe('Baseada em 1 correção.');
        expect(ruleEvidence({ kind: 'field_correction', evidence: 5 })).toBe('Baseada em 5 correções iguais.');
        expect(RULE_KIND.term).toBe('Vocabulário do escritório');
    });
});
