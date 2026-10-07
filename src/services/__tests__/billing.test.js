import { describe, it, expect } from 'vitest';
import { subscriptionNotice, trialDaysLeft, creditsNotice } from '../billing';

const now = new Date('2026-10-04T12:00:00Z');

describe('billing', () => {
    it('conta os dias restantes do trial (nunca negativo)', () => {
        expect(trialDaysLeft({ trial_termina_em: '2026-10-09T12:00:00Z' }, now)).toBe(5);
        expect(trialDaysLeft({ trial_termina_em: '2026-10-01T12:00:00Z' }, now)).toBe(0);
        expect(trialDaysLeft({}, now)).toBeNull();
    });

    it('mostra aviso conforme o estado da assinatura', () => {
        expect(subscriptionNotice({ estado: 'active' })).toBeNull();
        expect(subscriptionNotice(null)).toBeNull();
        const trial = subscriptionNotice({ estado: 'trialing', trial_termina_em: '2026-10-05T12:00:00Z', creditos_mensais: 30 }, now);
        expect(trial.tone).toBe('info');
        expect(trial.text).toMatch(/1 dia restante/);
        expect(subscriptionNotice({ estado: 'past_due' }).tone).toBe('warn');
        for (const estado of ['restricted', 'suspended', 'canceled']) expect(subscriptionNotice({ estado }).tone).toBe('danger');
    });

    it('resume créditos mensais e avulsos', () => {
        expect(creditsNotice({ ia_ativa: true, creditos_mensais: 300, creditos_avulsos: 0 })).toBe('300 créditos/mês');
        expect(creditsNotice({ ia_ativa: true, creditos_mensais: 300, creditos_avulsos: 40 })).toBe('300 créditos/mês + 40 avulsos disponíveis');
        expect(creditsNotice({ ia_ativa: true, creditos_mensais: 300, creditos_usados_mes: 12, creditos_avulsos: 0 })).toBe('12 de 300 créditos usados este mês');
        expect(creditsNotice({ ia_ativa: false })).toBeNull();
    });
});
