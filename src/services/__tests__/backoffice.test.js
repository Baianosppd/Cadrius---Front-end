import { describe, it, expect } from 'vitest';
import { buildActionBody, hasArea, orgActionsFor, ORG_ACTIONS, userActionsFor } from '../backoffice';

describe('backoffice', () => {
    it('mostra só as ações da área de quem está logado', () => {
        const trial = { ativo: true, estado_registrado: 'trialing' };
        expect(orgActionsFor(['financeiro'], trial).map((a) => a.key)).toEqual(['extend_trial', 'grant_credits']);
        expect(orgActionsFor(['ti'], trial).map((a) => a.key)).toEqual(['deactivate']);
        expect(orgActionsFor(['ti'], { ativo: false }).map((a) => a.key)).toEqual(['activate']);
        expect(orgActionsFor(['financeiro'], { ativo: true, estado_registrado: 'active' }).map((a) => a.key)).toEqual(['grant_credits']);
        expect(orgActionsFor([], trial)).toEqual([]);
        expect(hasArea(undefined, 'ti')).toBe(false);
    });

    it('ações de usuário conforme o estado da conta', () => {
        expect(userActionsFor({ ativo: true, bloqueado: false }).map((a) => a.key)).toEqual(['send_password_reset', 'revoke_sessions', 'deactivate']);
        expect(userActionsFor({ ativo: false, bloqueado: true }).map((a) => a.key)).toEqual(['unlock', 'revoke_sessions', 'activate']);
    });

    it('exige motivo e valida os números antes de enviar', () => {
        const spec = ORG_ACTIONS.grant_credits;
        expect(buildActionBody('grant_credits', { reason: 'curto', credits: 5, valid_days: 30 }, spec).ok).toBe(false);
        expect(buildActionBody('grant_credits', { reason: 'Cortesia pela instabilidade', credits: 0, valid_days: 30 }, spec).ok).toBe(false);
        expect(buildActionBody('grant_credits', { reason: 'Cortesia pela instabilidade', credits: '50', valid_days: '30' }, spec))
            .toEqual({ ok: true, body: { action: 'grant_credits', reason: 'Cortesia pela instabilidade', credits: 50, valid_days: 30 } });
        expect(buildActionBody('deactivate', { reason: '  Pedido formal do cliente  ' }, ORG_ACTIONS.deactivate).body.reason)
            .toBe('Pedido formal do cliente');
    });
});
