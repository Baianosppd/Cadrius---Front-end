import { describe, it, expect } from 'vitest';
import { apiErrors, brl, formToBody, fromLocalInput, toLocalInput } from '../financeiro';
import { gcalResult } from '../gcal';

describe('financeiro', () => {
    it('formata reais', () => {
        expect(brl('299')).toMatch(/R\$\s?299,00/);
        expect(brl(null)).toMatch(/R\$\s?0,00/);
    });

    it('monta o corpo da API: números, vazios nulos, listas e datas', () => {
        const fields = [
            { name: 'code', type: 'text' }, { name: 'value', type: 'text' }, { name: 'duration_months', type: 'number', nullable: true },
            { name: 'max_redemptions', type: 'number', nullable: true }, { name: 'plan_tiers', type: 'tiers' },
            { name: 'ends_at', type: 'datetime', nullable: true }, { name: 'is_active', type: 'checkbox' },
        ];
        const body = formToBody(fields, { code: 'PROMO', value: '20', duration_months: '', max_redemptions: '50', plan_tiers: ['PRO'], ends_at: '', is_active: true });
        expect(body).toEqual({ code: 'PROMO', value: '20', duration_months: null, max_redemptions: 50, plan_tiers: ['PRO'], ends_at: null, is_active: true });
        expect(formToBody([{ name: 'plan_tiers', type: 'tiers' }], {})).toEqual({ plan_tiers: [] });
    });

    it('ida e volta do datetime-local', () => {
        const iso = fromLocalInput('2026-12-01T10:30');
        expect(new Date(iso).getHours()).toBe(10);
        expect(toLocalInput(iso)).toBe('2026-12-01T10:30');
        expect(toLocalInput(null)).toBe('');
    });

    it('traduz erros do back em mensagens por campo', () => {
        expect(apiErrors({ response: { data: { value: ['Percentual deve ficar entre 0 e 100.'] } } })).toEqual(['value: Percentual deve ficar entre 0 e 100.']);
        expect(apiErrors({ response: { data: { detail: 'Sem permissão.' } } })).toEqual(['Sem permissão.']);
        expect(apiErrors({})[0]).toMatch(/Não foi possível/);
    });

    it('mensagens do retorno do Google Calendar', () => {
        expect(gcalResult('ok').tone).toBe('success');
        expect(gcalResult('no_refresh_token').text).toMatch(/myaccount.google.com/);
        expect(gcalResult('xyz')).toBeNull();
    });
});
