import { describe, it, expect } from 'vitest';
import { fieldsForConfirm, isBusy, normalizeFields } from '../documents';

describe('documents', () => {
    it('normaliza campos ausentes para o formulário de revisão', () => {
        const f = normalizeFields({ resumo: 'x', partes: [{ nome: 'Ana' }], prazos: [{ descricao: 'Contestar', data: '2026-11-01', fatal: true }] });
        expect(f.tipo_documento).toBe('OUTRO');
        expect(f.partes).toEqual([{ papel: '', nome: 'Ana' }]);
        expect(f.prazos[0]).toMatchObject({ descricao: 'Contestar', data: '2026-11-01', fatal: true });
        expect(f.proximos_passos).toEqual([]);
        expect(normalizeFields().partes).toEqual([]);
    });

    it('prepara o corpo da confirmação: remove linhas vazias, apara e zera datas em branco', () => {
        const body = fieldsForConfirm({
            tipo_documento: 'INTIMACAO', numero_processo: ' ', valor: '', resumo: ' Resumo ',
            partes: [{ papel: '', nome: ' Ana ' }, { papel: 'Réu', nome: '  ' }],
            prazos: [{ descricao: ' Contestar ', data: '', dias: 15, fatal: true }, { descricao: '', data: '2026-01-01', dias: null, fatal: false }],
            proximos_passos: [' Preparar ', ''],
        });
        expect(body.numero_processo).toBeNull();
        expect(body.valor).toBeNull();
        expect(body.resumo).toBe('Resumo');
        expect(body.partes).toEqual([{ papel: 'Parte', nome: 'Ana' }]);
        expect(body.prazos).toEqual([{ descricao: 'Contestar', data: null, dias: 15, fatal: true }]);
        expect(body.proximos_passos).toEqual(['Preparar']);
    });

    it('sabe quando a leitura ainda está em andamento', () => {
        expect(isBusy('pending')).toBe(true);
        expect(isBusy('processing')).toBe(true);
        expect(isBusy('review')).toBe(false);
        expect(isBusy('xyz')).toBe(false);
    });
});
