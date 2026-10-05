import { describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({ default: {} }));

import { brl, groupByStage, monthBars, parseBRL, previewSchedule, stageTotal } from '../carteira';
import { NF_MANUAL, NF_STATUS, OBLIGATION_STATUS } from '../backoffice';
import { APP_MENU } from '../../layouts/appMenu';

describe('dinheiro', () => {
    it('formata e lê valores em reais', () => {
        expect(brl(123456)).toBe('R$ 1.234,56');
        expect(parseBRL('R$ 1.234,56')).toBe(123456);
        expect(parseBRL('1234.5')).toBe(123450);
        expect(parseBRL('')).toBeNull();
        expect(parseBRL('abc')).toBeNull();
    });
});

describe('prévia das parcelas (igual ao back)', () => {
    it('parcelado divide e joga a sobra na 1ª', () => {
        const rows = previewSchedule('parcelado', 100000, 3, '2026-01-31');
        expect(rows.map((r) => r.cents)).toEqual([33334, 33333, 33333]);
        expect(rows.map((r) => r.due)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
        expect(rows[0].label).toBe('Parcela 1/3');
    });
    it('mensal repete o valor; êxito não gera parcela; à vista é uma só', () => {
        expect(previewSchedule('mensal', 50000, 2, '2026-12-10').map((r) => [r.cents, r.due])).toEqual([[50000, '2026-12-10'], [50000, '2027-01-10']]);
        expect(previewSchedule('exito', 0, 1, '2026-01-01')).toEqual([]);
        expect(previewSchedule('avista', 1000, 5, '2026-01-01')).toEqual([{ label: 'Honorários', cents: 1000, due: '2026-01-01' }]);
        expect(previewSchedule('misto', 3000, 2, '2026-01-01')[0].label).toBe('Entrada 1/2');
    });
});

describe('funil e painel', () => {
    it('agrupa por etapa e soma', () => {
        const g = groupByStage([{ etapa: 'novo', valor_centavos: 100 }, { etapa: 'novo', valor_centavos: 50 }, { etapa: 'ganho', valor_centavos: 9 }]);
        expect(g.novo).toHaveLength(2);
        expect(stageTotal(g.novo)).toBe(150);
        expect(g.perdido).toEqual([]);
    });
    it('barras proporcionais ao maior valor', () => {
        expect(monthBars([{ mes: '2026-10', recebido: 200, despesas: 50 }])[0]).toMatchObject({ recebidoPct: 100, despesasPct: 25 });
        expect(monthBars([])).toEqual([]);
    });
});

describe('fiscal e menu', () => {
    it('registro manual só usa as situações da fase 1', () => {
        expect(NF_MANUAL.every((k) => NF_STATUS[k])).toBe(true);
        expect(NF_MANUAL).not.toContain('processing');
        expect(OBLIGATION_STATUS.atrasado.tone).toBe('red');
    });
    it('menu tem Carteira e Finanças', () => {
        const all = APP_MENU.flatMap((s) => s.items.map((i) => i.to));
        expect(all).toEqual(expect.arrayContaining(['/carteira', '/financas']));
    });
});
