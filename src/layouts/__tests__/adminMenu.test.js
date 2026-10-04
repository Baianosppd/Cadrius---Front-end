import { describe, it, expect } from 'vitest';
import { visibleMenu } from '../adminMenu';

describe('menu da Gestão Cadrius', () => {
    it('cada área vê só o que é dela', () => {
        const labels = (areas) => visibleMenu(areas).map((m) => m.label);
        expect(labels(['financeiro'])).toEqual(['Visão geral', 'Escritórios', 'Financeiro']);
        expect(labels(['ti'])).toEqual(['Visão geral', 'Escritórios', 'Usuários', 'Sistema e operação', 'Segurança e conformidade']);
        expect(labels(['financeiro', 'ti'])).toHaveLength(6);
    });
});
