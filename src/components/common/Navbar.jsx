import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut, FiX } from 'react-icons/fi';
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

// Menu lateral do escritório (CAD-174): seções, rolagem própria e, no celular, gaveta com botão de fechar
function Navbar({ onNavigate, onClose }) {
    const { logout, isOrgManager, isStaff, isSolo, organization, access } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`);
    const helpTo = `/suporte${pathname.startsWith('/suporte') ? '' : `?novo=1&de=${encodeURIComponent(pathname)}`}`;

    return (
        <nav className={styles.sidebar} aria-label="Menu principal">
            <div className={styles.logo_container}>
                <Link to="/dashboard" className={styles.sidebar_title} onClick={onNavigate}>Cadrius</Link>
                <EnvBadge />
                {onClose && <button type="button" className={styles.close_btn} onClick={onClose} aria-label="Fechar menu"><FiX /></button>}
            </div>
            <div className={styles.scroll}>
                {visibleMenu(isOrgManager, { solo: isSolo, maxUsers: organization?.max_users ?? 99, perms: access?.permissoes ?? null }).map((section) => (
                    <div key={section.section} className={styles.section}>
                        <div className={styles.section_label}>{section.section}</div>
                        <ul className={styles.nav_list}>
                            {section.items.map((item) => <Item key={item.to} item={item} active={isActive(item.to)} onNavigate={onNavigate} />)}
                        </ul>
                    </div>
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
