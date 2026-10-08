import { describe, it, expect } from 'vitest';
import { visibleMenu, visibleSections } from '../adminMenu';

describe('menu da Gestão Cadrius', () => {
    it('cada área vê só o que é dela', () => {
        const labels = (areas) => visibleMenu(areas).map((m) => m.label);
        expect(labels(['financeiro'])).toEqual(['Visão geral', 'Escritórios', 'Financeiro']);
        expect(labels(['ti'])).toEqual(['Visão geral', 'Escritórios', 'Suporte', 'Usuários', 'Equipe Cadrius', 'Sistema e operação', 'IA por atividade', 'Cibersegurança', 'Segurança e conformidade']);
        expect(labels(['suporte'])).toEqual(['Visão geral', 'Escritórios', 'Suporte']);
        expect(labels(['fiscal'])).toEqual(['Visão geral', 'Escritórios', 'Fiscal']);
        expect(labels(['financeiro', 'fiscal', 'suporte', 'ti'])).toHaveLength(11);
    });
});

describe('grupos do menu da Gestão (CAD-232)', () => {
    it('agrupa por assunto e não cria grupo de um item só', () => {
        const ti = visibleSections(['ti']);
        expect(ti.map((s) => s.section)).toEqual(['Início', 'Atendimento', 'Pessoas e acessos', 'Plataforma']);
        expect(ti.find((s) => s.section === 'Atendimento')).toMatchObject({ single: true, collapsible: false });
        expect(ti.find((s) => s.section === 'Plataforma').items).toHaveLength(4);
        const fin = visibleSections(['financeiro', 'fiscal']);
        expect(fin.find((s) => s.section === 'Receita')).toMatchObject({ collapsible: true });
        expect(fin.find((s) => s.section === 'Receita').items.map((i) => i.label)).toEqual(['Financeiro', 'Fiscal']);
    });
});
