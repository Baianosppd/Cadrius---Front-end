import { FiBriefcase, FiDollarSign, FiFileText, FiGrid, FiServer, FiShield, FiUserCheck, FiUsers } from 'react-icons/fi';

// Menu: cada item diz qual área enxerga (vazio = qualquer área da equipe)
const MENU = [
    { to: '/gestao', end: true, label: 'Visão geral', icon: FiGrid, areas: [] },
    { to: '/gestao/escritorios', label: 'Escritórios', icon: FiBriefcase, areas: [] },
    { to: '/gestao/financeiro', label: 'Financeiro', icon: FiDollarSign, areas: ['financeiro'] },
    { to: '/gestao/fiscal', label: 'Fiscal', icon: FiFileText, areas: ['fiscal'] },
    { to: '/gestao/usuarios', label: 'Usuários', icon: FiUsers, areas: ['ti'] },
    { to: '/gestao/equipe', label: 'Equipe Cadrius', icon: FiUserCheck, areas: ['ti'] },
    { to: '/gestao/sistema', label: 'Sistema e operação', icon: FiServer, areas: ['ti'] },
    { to: '/gestao/seguranca', label: 'Segurança e conformidade', icon: FiShield, areas: ['ti'] },
];

export function visibleMenu(areas) {
    return MENU.filter((m) => m.areas.length === 0 || m.areas.some((a) => areas.includes(a)));
}
