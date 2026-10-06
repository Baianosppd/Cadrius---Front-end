import { describe, it, expect } from 'vitest';
import { visibleMenu } from '../adminMenu';

describe('menu da Gestão Cadrius', () => {
    it('cada área vê só o que é dela', () => {
        const labels = (areas) => visibleMenu(areas).map((m) => m.label);
        expect(labels(['financeiro'])).toEqual(['Visão geral', 'Escritórios', 'Financeiro']);
        expect(labels(['ti'])).toEqual(['Visão geral', 'Escritórios', 'Suporte', 'Usuários', 'Equipe Cadrius', 'Sistema e operação', 'Cibersegurança', 'Segurança e conformidade']);
        expect(labels(['suporte'])).toEqual(['Visão geral', 'Escritórios', 'Suporte']);
        expect(labels(['fiscal'])).toEqual(['Visão geral', 'Escritórios', 'Fiscal']);
        expect(labels(['financeiro', 'fiscal', 'suporte', 'ti'])).toHaveLength(10);
    });
});
