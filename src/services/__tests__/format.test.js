import { describe, expect, it } from 'vitest';
import { maskCep, maskCnpj, maskCpf, maskMoney, maskPhone } from '../../utils/format';

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

describe('máscaras de documento e contato', () => {
    it('formata conforme digita, sem pontuação sobrando no fim', () => {
        expect(maskCpf('123')).toBe('123');
        expect(maskCpf('1234')).toBe('123.4');
        expect(maskCpf('12345678901')).toBe('123.456.789-01');
        expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81');
        expect(maskCep('01310100')).toBe('01310-100');
    });
    it('ignora letras e corta o excesso', () => {
        expect(maskCpf('123.456.789-0199')).toBe('123.456.789-01');
        expect(maskCnpj('ab11222333000181')).toBe('11.222.333/0001-81');
        expect(maskCep('')).toBe('');
    });
    it('telefone fixo e celular', () => {
        expect(maskPhone('1134567890')).toBe('(11) 3456-7890');
        expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
        expect(maskPhone('11')).toBe('(11');
    });
});
