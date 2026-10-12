import { FiCalendar, FiFileText, FiMail, FiZap } from 'react-icons/fi';

// Ícone e cores de cada tipo de notificação (lista e detalhe). O roxo ainda não tem token — pendente com o Allan (CAD-127).
export const TIPOS = {
    documento: { icon: FiFileText, color: 'var(--c-info)', bg: 'var(--c-primary-50)' },
    prazo: { icon: FiCalendar, color: 'var(--c-warning)', bg: 'var(--c-warning-bg)' },
    automacao: { icon: FiZap, color: '#8b5cf6', bg: 'rgba(139, 92, 246, .14)' },
    erro: { icon: FiMail, color: 'var(--c-danger)', bg: 'var(--c-danger-bg)' },
};

export const tipo = (t) => TIPOS[t] || TIPOS.documento;
