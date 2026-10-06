// Menu do escritório agrupado por seção (CAD-174). Ordem = frequência de uso no dia a dia.
import {
    FiActivity, FiBriefcase, FiCalendar, FiCheckCircle, FiCpu, FiMessageCircle, FiPackage, FiEdit3, FiHelpCircle, FiHome, FiInbox, FiLayers, FiLock,
    FiDollarSign, FiMail, FiSettings, FiShield, FiTarget, FiTrendingUp, FiUpload, FiUsers, FiZap,
} from 'react-icons/fi';

export const APP_MENU = [
    {
        section: 'Dia a dia', items: [
            { to: '/dashboard', label: 'Painel', icon: FiHome },
            { to: '/assistente', label: 'Assistente IA', icon: FiMessageCircle },
            { to: '/publicacoes', label: 'Publicações', icon: FiInbox },
            { to: '/documents', label: 'Documentos', icon: FiMail },
            { to: '/acompanhamento', label: 'Processos acompanhados', icon: FiBriefcase },
            { to: '/agenda-forense', label: 'Agenda forense', icon: FiCalendar },
        ],
    },
    {
        section: 'Produção', items: [
            { to: '/minutas', label: 'Minutas', icon: FiEdit3 },
            { to: '/automacao', label: 'Automações', icon: FiZap },
            { to: '/contatos', label: 'Contatos', icon: FiUsers },
            { to: '/carteira', label: 'Carteira de clientes', icon: FiTarget },
            { to: '/marketing', label: 'Marketing', icon: FiTrendingUp },
        ],
    },
    {
        section: 'Escritório', items: [
            { to: '/financas', label: 'Finanças', icon: FiDollarSign },
            { to: '/aprovacoes', label: 'IA do escritório', icon: FiCheckCircle },
            { to: '/integracoes', label: 'Integrações', icon: FiLayers },
            { to: '/plugins', label: 'Plugins (Claude, ChatGPT)', icon: FiPackage },
            { to: '/importar', label: 'Importar dados', icon: FiUpload },
            { to: '/equipe', label: 'Equipe', soloLabel: 'Convidar alguém', icon: FiSettings, hideSoloWhenSingleSeat: true },
        ],
    },
    {
        section: 'Segurança', items: [
            { to: '/privacidade', label: 'Privacidade', icon: FiLock },
            { to: '/ia', label: 'IA segura', icon: FiCpu },
            { to: '/auditoria', label: 'Auditoria', icon: FiActivity, managersOnly: true },
        ],
    },
];

export const HELP_ITEM = { to: '/suporte', label: 'Ajuda e suporte', icon: FiHelpCircle };
export const STAFF_ITEM = { to: '/gestao', label: 'Gestão Cadrius', icon: FiShield };

// Filtra pelo perfil (itens só de dono/admin)
// solo = advogado autônomo (CAD-222): sem textos de equipe; "Equipe" some se o plano só tem 1 usuário
export function visibleMenu(isOrgManager, { solo = false, maxUsers = 99 } = {}) {
    return APP_MENU.map((s) => ({
        ...s,
        items: s.items
            .filter((i) => !i.managersOnly || isOrgManager)
            .filter((i) => !(solo && i.hideSoloWhenSingleSeat && maxUsers <= 1))
            .map((i) => (solo && i.soloLabel ? { ...i, label: i.soloLabel } : i)),
    })).filter((s) => s.items.length);
}
