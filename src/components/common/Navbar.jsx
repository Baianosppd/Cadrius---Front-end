import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiChevronDown, FiLogOut, FiX } from 'react-icons/fi';
import styles from './Navbar.module.css';
import useAuth from '../../hooks/useAuth';
import { HELP_ITEM, STAFF_ITEM, visibleMenu } from '../../layouts/appMenu';
import EnvBadge from './EnvBadge';

function Item({ item, active, to, onNavigate }) {
    const Icon = item.icon;
    return (
        <li className={`${styles.nav_item} ${active ? styles.active : ''}`}>
            <Link to={to || item.to} onClick={onNavigate} aria-current={active ? 'page' : undefined}>
                <Icon className={styles.nav_icon} aria-hidden="true" />
                <span className={styles.nav_text}>{item.label}</span>
            </Link>
        </li>
    );
}

const OPEN_KEY = 'cadrius.menu.open';
const readOpen = () => { try { return JSON.parse(localStorage.getItem(OPEN_KEY) || '[]'); } catch { return []; } };

// Grupo recolhível (CAD-225): abre com um clique e fica aberto sozinho quando a tela atual é dele
function Group({ section, isActive, onNavigate, open, onToggle }) {
    const hasActive = section.items.some((i) => isActive(i.to));
    const expanded = open || hasActive;
    const id = `menu-${section.section.toLowerCase().replace(/\W+/g, '-')}`;
    const Icon = section.icon;
    return (
        <div className={styles.section}>
            <button type="button" className={`${styles.group_btn} ${hasActive ? styles.group_active : ''}`} aria-expanded={expanded} aria-controls={id}
                onClick={() => onToggle(section.section)}>
                {Icon && <Icon className={styles.nav_icon} aria-hidden="true" />}
                <span className={styles.nav_text}>{section.section}</span>
                <FiChevronDown className={`${styles.chevron} ${expanded ? styles.chevron_open : ''}`} aria-hidden="true" />
            </button>
            {expanded && (
                <ul id={id} className={`${styles.nav_list} ${styles.sub_list}`}>
                    {section.items.map((item) => <Item key={item.to} item={item} active={isActive(item.to)} onNavigate={onNavigate} />)}
                </ul>
            )}
        </div>
    );
}

// Menu lateral do escritório (CAD-174): seções, rolagem própria e, no celular, gaveta com botão de fechar
function Navbar({ onNavigate, onClose }) {
    const { logout, isOrgManager, isStaff, isSolo, organization, access } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`);
    const helpTo = `/suporte${pathname.startsWith('/suporte') ? '' : `?novo=1&de=${encodeURIComponent(pathname)}`}`;
    const [openGroups, setOpenGroups] = useState(readOpen);
    const toggle = (name) => setOpenGroups((prev) => {
        const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
        try { localStorage.setItem(OPEN_KEY, JSON.stringify(next)); } catch { /* preferência só deste navegador */ }
        return next;
    });

    return (
        <nav className={styles.sidebar} aria-label="Menu principal">
            <div className={styles.logo_container}>
                <Link to="/dashboard" className={styles.sidebar_title} onClick={onNavigate}>
                    <img src="/favicon.svg" alt="" width="26" height="26" className={styles.brand_mark} />Cadrius</Link>
                <EnvBadge />
                {onClose && <button type="button" className={styles.close_btn} onClick={onClose} aria-label="Fechar menu"><FiX /></button>}
            </div>
            <div className={styles.scroll}>
                {visibleMenu(isOrgManager, { solo: isSolo, maxUsers: organization?.max_users ?? 99, perms: access?.permissoes ?? null }).map((section) => (
                    section.collapsible ? (
                        <Group key={section.section} section={section} isActive={isActive} onNavigate={onNavigate}
                            open={openGroups.includes(section.section)} onToggle={toggle} />
                    ) : (
                        <div key={section.section} className={styles.section}>
                            <div className={styles.section_label}>{section.section}</div>
                            <ul className={styles.nav_list}>
                                {section.items.map((item) => <Item key={item.to} item={item} active={isActive(item.to)} onNavigate={onNavigate} />)}
                            </ul>
                        </div>
                    )
                ))}
                <ul className={styles.nav_list}>
                    <Item item={HELP_ITEM} to={helpTo} active={isActive('/suporte')} onNavigate={onNavigate} />
                    {isStaff && <Item item={STAFF_ITEM} active={isActive('/gestao')} onNavigate={onNavigate} />}
                </ul>
            </div>
            <div className={styles.sidebar_footer}>
                <button type="button" className={styles.logout_link} onClick={async () => { await logout(); navigate('/', { replace: true }); }}>
                    <FiLogOut className={styles.nav_icon} aria-hidden="true" />
                    <span className={styles.nav_text}>Sair</span>
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
