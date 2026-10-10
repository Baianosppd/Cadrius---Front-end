import { describe, expect, it } from 'vitest';
import { maskMoney } from '../../utils/format';

describe('maskMoney (máscara de caixa)', () => {
    it('trata os 2 últimos dígitos como centavos', () => {
        expect(maskMoney('1')).toBe('0,01');
        expect(maskMoney('150')).toBe('1,50');
        expect(maskMoney('150000')).toBe('1.500,00');
    });
    it('ignora letras e símbolos', () => {
        expect(maskMoney('12a3b4')).toBe('12,34');
        expect(maskMoney('abc')).toBe('');
        expect(maskMoney('R$ 1.234,56')).toBe('1.234,56');
    });
    it('reformata enquanto digita e ao apagar', () => {
        expect(maskMoney('1.500,005')).toBe('15.000,05');
        expect(maskMoney('1.500,0')).toBe('150,00');
        expect(maskMoney('0,0')).toBe('');
    });
    it('formata número vindo da API', () => {
        expect(maskMoney(1500.5)).toBe('1.500,50');
        expect(maskMoney(0)).toBe('0,00');
    });
    it('vazio fica vazio', () => {
        expect(maskMoney('')).toBe('');
        expect(maskMoney(null)).toBe('');
        expect(maskMoney(undefined)).toBe('');
    });
});
