import { FiLink, FiMail } from 'react-icons/fi';
import {
    SiBrevo, SiCalendly, SiClickup, SiGooglesheets, SiMailchimp, SiMeta, SiNotion, SiSlack, SiTelegram, SiTrello, SiWhatsapp, SiZoom,
} from 'react-icons/si';
import s from './AppLogo.module.css';

// Logo de cada app de Integrações (CAD-227). Marcas com ícone no Simple Icons usam o ícone oficial; as demais (muitas
// brasileiras) usam a sigla na cor da marca. Tudo local: nenhuma imagem é baixada de site de terceiros.
const LOGOS = {
    WHATSAPP: { icon: SiWhatsapp, bg: '#25D366' },
    SMTP: { icon: FiMail, bg: '#475569' },
    META: { icon: SiMeta, bg: '#0866FF' },
    NOTION: { icon: SiNotion, bg: '#111111' },
    CALENDLY: { icon: SiCalendly, bg: '#006BFF' },
    SLACK: { icon: SiSlack, bg: '#4A154B' },
    TELEGRAM: { icon: SiTelegram, bg: '#26A5E4' },
    TRELLO: { icon: SiTrello, bg: '#0052CC' },
    CLICKUP: { icon: SiClickup, bg: '#7B68EE' },
    SHEETS: { icon: SiGooglesheets, bg: '#34A853' },
    BREVO: { icon: SiBrevo, bg: '#0B996E' },
    MAILCHIMP: { icon: SiMailchimp, bg: '#FFE01B', fg: '#241C15' },
    ZOOM: { icon: SiZoom, bg: '#0B5CFF' },
    WEBHOOK: { icon: FiLink, bg: '#334155' },
    TEAMS: { text: 'T', bg: '#5059C9' },
    ZAPSIGN: { text: 'ZS', bg: '#1B4DFF' },
    ASAAS: { text: 'as', bg: '#0030B9' },
    D4SIGN: { text: 'D4', bg: '#00A859' },
    CLICKSIGN: { text: 'Cs', bg: '#0A7CFF' },
    AUTENTIQUE: { text: 'Au', bg: '#0F766E' },
    ESCAVADOR: { text: 'Es', bg: '#F2A900', fg: '#1f2937' },
    JUDIT: { text: 'Ju', bg: '#5B21B6' },
    JUSBRASIL: { text: 'Jb', bg: '#0B5394' },
    ASTREA: { text: 'As', bg: '#E85D04' },
    NFEIO: { text: 'NF', bg: '#FF6B00' },
    OMIE: { text: 'Om', bg: '#00A0DF' },
    PIPEDRIVE: { text: 'P', bg: '#1A1A1A' },
    RDSTATION: { text: 'RD', bg: '#0B8FB3' },
    ZENVIA: { text: 'Zv', bg: '#5E2BFF' },
    BRASILAPI: { text: 'BR', bg: '#16A34A' },
};

export default function AppLogo({ app, label, size = 40 }) {
    const l = LOGOS[app] || { text: (label || app || '?').replace(/[^A-Za-zÀ-ú0-9]/g, '').slice(0, 2), bg: '#64748B' };
    const Icon = l.icon;
    return (
        <span className={s.logo} style={{ width: size, height: size, background: l.bg, color: l.fg || '#fff', fontSize: size * 0.42 }} aria-hidden="true">
            {Icon ? <Icon size={size * 0.55} /> : l.text}
        </span>
    );
}
