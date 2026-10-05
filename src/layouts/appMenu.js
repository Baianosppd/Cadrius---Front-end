// Menu do escritório agrupado por seção (CAD-174). Ordem = frequência de uso no dia a dia.
import {
    FiActivity, FiBriefcase, FiCalendar, FiCheckCircle, FiCpu, FiEdit3, FiHelpCircle, FiHome, FiInbox, FiLayers, FiLock,
    FiMail, FiSettings, FiShield, FiTrendingUp, FiUpload, FiUsers, FiZap,
} from 'react-icons/fi';

export const APP_MENU = [
    {
        section: 'Dia a dia', items: [
            { to: '/dashboard', label: 'Dashboard', icon: FiHome },
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
            { to: '/marketing', label: 'Marketing', icon: FiTrendingUp },
        ],
    },
    {
        section: 'Escritório', items: [
            { to: '/aprovacoes', label: 'IA do escritório', icon: FiCheckCircle },
            { to: '/integracoes', label: 'Integrações', icon: FiLayers },
            { to: '/importar', label: 'Importar dados', icon: FiUpload },
            { to: '/equipe', label: 'Equipe', icon: FiSettings },
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
export function visibleMenu(isOrgManager) {
    return APP_MENU.map((s) => ({ ...s, items: s.items.filter((i) => !i.managersOnly || isOrgManager) })).filter((s) => s.items.length);
}
