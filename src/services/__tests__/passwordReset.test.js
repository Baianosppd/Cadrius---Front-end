import { describe, it, expect } from 'vitest';
import { parseResetFragment, passwordResetError } from '../passwordReset';

describe('passwordReset', () => {
    it('lê uid e token do fragmento do link', () => {
        expect(parseResetFragment('#uid=MQ&token=abc-123')).toEqual({ uid: 'MQ', token: 'abc-123' });
    });

    it('recusa link incompleto ou vazio', () => {
        expect(parseResetFragment('')).toBeNull();
        expect(parseResetFragment('#uid=MQ')).toBeNull();
        expect(parseResetFragment('?uid=MQ&token=x')).toBeNull(); // token na query não é aceito
    });

    it('traduz erros do back', () => {
        expect(passwordResetError({ response: { status: 429 } })).toMatch(/Muitas tentativas/);
        expect(passwordResetError({ response: { status: 400, data: { code: 'invalid_token', detail: 'Link inválido' } } })).toBe('Link inválido');
        expect(passwordResetError({ response: { status: 400, data: { new_password: ['Senha comum.', 'Muito curta.'] } } })).toBe('Senha comum. Muito curta.');
        expect(passwordResetError({})).toMatch(/Tente novamente/);
    });
});
