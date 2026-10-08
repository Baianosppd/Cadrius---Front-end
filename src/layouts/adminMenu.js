import { FiActivity, FiBookOpen, FiBriefcase, FiCpu, FiDollarSign, FiFileText, FiGrid, FiHelpCircle, FiServer, FiShield, FiTrendingUp, FiUserCheck, FiUsers } from 'react-icons/fi';

// Menu da Gestão Cadrius (CAD-232): grupos recolhíveis como o menu do escritório. Cada item diz qual área enxerga
// (vazio = qualquer área da equipe). O primeiro grupo fica sempre aberto.
export const ADMIN_MENU = [
    {
        section: 'Início', items: [
            { to: '/gestao', end: true, label: 'Visão geral', icon: FiGrid, areas: [] },
            { to: '/gestao/escritorios', label: 'Escritórios', icon: FiBriefcase, areas: [] },
        ],
    },
    {
        section: 'Receita', collapsible: true, icon: FiDollarSign, items: [
            { to: '/gestao/financeiro', label: 'Financeiro', icon: FiDollarSign, areas: ['financeiro'] },
            { to: '/gestao/fiscal', label: 'Fiscal', icon: FiFileText, areas: ['fiscal'] },
            { to: '/gestao/marketing', label: 'Marketing', icon: FiTrendingUp, areas: ['marketing'] },
        ],
    },
    {
        section: 'Atendimento', collapsible: true, icon: FiHelpCircle, items: [
            { to: '/gestao/suporte', label: 'Suporte', icon: FiHelpCircle, areas: ['suporte', 'ti'] },
            { to: '/gestao/juridico', label: 'Calendário forense', icon: FiBookOpen, areas: ['juridico'] },
        ],
    },
    {
        section: 'Pessoas e acessos', collapsible: true, icon: FiUsers, items: [
            { to: '/gestao/usuarios', label: 'Usuários', icon: FiUsers, areas: ['ti'] },
            { to: '/gestao/equipe', label: 'Equipe Cadrius', icon: FiUserCheck, areas: ['ti'] },
        ],
    },
    {
        section: 'Plataforma', collapsible: true, icon: FiServer, items: [
            { to: '/gestao/sistema', label: 'Sistema e operação', icon: FiServer, areas: ['ti'] },
            { to: '/gestao/ia', label: 'IA por atividade', icon: FiCpu, areas: ['ti'] },
            { to: '/gestao/ciberseguranca', label: 'Cibersegurança', icon: FiActivity, areas: ['ti'] },
            { to: '/gestao/seguranca', label: 'Segurança e conformidade', icon: FiShield, areas: ['ti'] },
        ],
    },
];

const sees = (areas) => (m) => m.areas.length === 0 || m.areas.some((a) => areas.includes(a));

// Grupos com o que a pessoa enxerga. Grupo com um item só vira link direto (não faz sentido abrir para ver um).
export function visibleSections(areas) {
    return ADMIN_MENU.map((s) => ({ ...s, items: s.items.filter(sees(areas)) }))
        .filter((s) => s.items.length)
        .map((s) => (s.items.length === 1 ? { ...s, collapsible: false, single: true } : s));
}

export function visibleMenu(areas) {
    return ADMIN_MENU.flatMap((s) => s.items).filter(sees(areas));
}
