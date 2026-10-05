import { describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({ default: {} }));

import { confidenceTone, confirmBody, countPending, docxName, nextPending } from '../publications';
import { triggerHasDeadline } from '../rules';

describe('publicações e minutas (CAD-173)', () => {
    it('confiança da triagem', () => {
        expect(confidenceTone(85)[0]).toBe('green');
        expect(confidenceTone(65)[1]).toBe('média');
        expect(confidenceTone(40)[1]).toMatch(/confira/);
    });

    it('confirmação só manda o que mudou', () => {
        expect(confirmBody({ prazo_dias: 15, acompanhar: false }, { prazo_dias: 15 })).toEqual({ acompanhar: false });
        expect(confirmBody({ prazo_dias: '5', vencimento: '2026-03-16', acompanhar: true, observacao: ' ok ' }, { prazo_dias: 15 }))
            .toEqual({ acompanhar: true, prazo_dias: 5, vencimento: '2026-03-16', observacao: 'ok' });
    });

    it('pendências [COMPLETAR] e navegação entre elas', () => {
        const t = 'A [COMPLETAR: Cidade], B [COMPLETAR: OAB].';
        expect(countPending(t)).toBe(2);
        expect(nextPending(t)).toEqual([2, 21]);
        expect(nextPending(t, 21)).toEqual([25, 41]);
        expect(nextPending(t, 41)).toEqual([2, 21]);                 // volta ao começo
        expect(nextPending('sem nada')).toBeNull();
    });

    it('nome do .docx sem acentos nem símbolos', () => {
        expect(docxName('Manifestação de ciência / cumprimento — 1001234-56.2026')).toBe('Manifestacao de ciencia cumprimento 1001234-562026.docx');
        expect(docxName('///')).toBe('minuta.docx');
    });

    it('publicação nova traz data de prazo para tarefas', () => {
        expect(triggerHasDeadline('publication_new')).toBe(true);
    });
});
