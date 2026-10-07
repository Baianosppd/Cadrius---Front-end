// Menu do escritório agrupado por seção (CAD-174). Ordem = frequência de uso no dia a dia.
import {
    FiActivity, FiBriefcase, FiCalendar, FiCheckCircle, FiCpu, FiMessageCircle, FiPackage, FiEdit3, FiHelpCircle, FiHome, FiInbox, FiLayers, FiLock,
    FiDollarSign, FiMail, FiSettings, FiShield, FiTarget, FiTrendingUp, FiUpload, FiUsers, FiZap,
} from 'react-icons/fi';

// CAD-225: menu mais curto — "Dia a dia" sempre aberto; os demais grupos abrem com um clique (e sozinhos na tela ativa)
export const APP_MENU = [
    {
        section: 'Dia a dia', items: [
            { to: '/dashboard', label: 'Painel', icon: FiHome },
            { to: '/assistente', label: 'Assistente IA', icon: FiMessageCircle, module: 'ia' },
            { to: '/publicacoes', label: 'Publicações', icon: FiInbox, module: 'processos' },
            { to: '/acompanhamento', label: 'Processos', icon: FiBriefcase, module: 'processos' },
            { to: '/agenda-forense', label: 'Agenda forense', icon: FiCalendar, module: 'processos' },
            { to: '/documents', label: 'Documentos', icon: FiMail, module: 'documentos' },
        ],
    },
    {
        section: 'Produção', collapsible: true, icon: FiEdit3, items: [
            { to: '/minutas', label: 'Minutas', icon: FiEdit3, module: 'minutas' },
            { to: '/automacao', label: 'Automações', icon: FiZap, module: 'automacoes' },
            { to: '/contatos', label: 'Contatos', icon: FiUsers, module: 'contatos' },
        ],
    },
    {
        section: 'Clientes e finanças', collapsible: true, icon: FiTarget, items: [
            { to: '/carteira', label: 'Carteira de clientes', icon: FiTarget, module: 'funil' },
            { to: '/financas', label: 'Finanças', icon: FiDollarSign, module: 'financeiro' },
            { to: '/marketing', label: 'Marketing', icon: FiTrendingUp, module: 'marketing' },
        ],
    },
    {
        section: 'Configurações', collapsible: true, icon: FiSettings, items: [
            { to: '/equipe', label: 'Equipe', soloLabel: 'Convidar alguém', icon: FiSettings, hideSoloWhenSingleSeat: true },
            { to: '/integracoes', label: 'Integrações', icon: FiLayers, module: 'integracoes' },
            { to: '/aprovacoes', label: 'IA do escritório', icon: FiCheckCircle, module: 'automacoes' },
            { to: '/plugins', label: 'Plugins de IA', icon: FiPackage, module: 'ia' },
            { to: '/importar', label: 'Importar dados', icon: FiUpload, module: 'importacao' },
        ],
    },
    {
        section: 'Segurança', collapsible: true, icon: FiShield, items: [
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
// perms = permissões do grupo de acesso (CAD-223); null = sem grupo (vale o cargo)
export function visibleMenu(isOrgManager, { solo = false, maxUsers = 99, perms = null } = {}) {
    return APP_MENU.map((s) => ({
        ...s,
        items: s.items
            .filter((i) => !i.managersOnly || isOrgManager)
            .filter((i) => !perms || !i.module || perms.includes(`${i.module}.ver`))
            .filter((i) => !(solo && i.hideSoloWhenSingleSeat && maxUsers <= 1))
            .map((i) => (solo && i.soloLabel ? { ...i, label: i.soloLabel } : i)),
    })).filter((s) => s.items.length);
}
