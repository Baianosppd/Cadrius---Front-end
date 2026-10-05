import { describe, it, expect } from 'vitest';
import { normalizeCode, recoveryCodesText, svgDataUri } from '../mfa';

describe('mfa', () => {
    it('normaliza o código digitado', () => {
        expect(normalizeCode(' 123 456 ')).toBe('123456');
        expect(normalizeCode('AB12-CD34')).toBe('ab12-cd34');
        expect(normalizeCode(undefined)).toBe('');
    });

    it('QR vira data URI de imagem (nunca HTML na página)', () => {
        const uri = svgDataUri('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
        expect(uri.startsWith('data:image/svg+xml;base64,')).toBe(true);
        expect(atob(uri.split(',')[1])).toContain('<svg');
        expect(svgDataUri('')).toBe('');
    });

    it('texto dos códigos de recuperação', () => {
        const txt = recoveryCodesText(['aaaa-bbbb', 'cccc-dddd'], 'ana@x.com');
        expect(txt).toContain('Conta: ana@x.com');
        expect(txt.trim().split('\n').slice(-2)).toEqual(['aaaa-bbbb', 'cccc-dddd']);
    });
});
