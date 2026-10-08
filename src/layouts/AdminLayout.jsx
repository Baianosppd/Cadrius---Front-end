import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiActivity, FiArrowLeft, FiChevronDown, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import { AREA_LABEL, backofficeApi } from '../services/backoffice';
import { errorMessage } from '../components/seguranca/ui';
import ConsentModal from '../components/seguranca/ConsentModal';
import MfaSetup from '../components/seguranca/MfaSetup';
import styles from './AdminLayout.module.css';
import { visibleSections } from './adminMenu';
import ThemeToggle from '../components/common/ThemeToggle';

const OPEN_KEY = 'cadrius.gestao.menu.open';
const readOpen = () => { try { return JSON.parse(localStorage.getItem(OPEN_KEY) || '[]'); } catch { return []; } };

function MenuLink({ item, onNavigate }) {
    return (
        <NavLink to={item.to} end={item.end} onClick={onNavigate} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            <item.icon aria-hidden="true" /> {item.label}
        </NavLink>
    );
}

// CAD-232: menu da Gestão em grupos recolhíveis (como o do escritório); o grupo da tela atual abre sozinho
function AdminMenu({ areas, onNavigate }) {
    const { pathname } = useLocation();
    const [open, setOpen] = useState(readOpen);
    const toggle = (name) => setOpen((prev) => {
        const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
        try { localStorage.setItem(OPEN_KEY, JSON.stringify(next)); } catch { /* preferência só deste navegador */ }
        return next;
    });
    const isActive = (item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`));
    return visibleSections(areas).map((s) => {
        if (!s.collapsible) {
            return (
                <div key={s.section} className={styles.group}>
                    {!s.single && <div className={styles.group_label}>{s.section}</div>}
                    {s.items.map((item) => <MenuLink key={item.to} item={item} onNavigate={onNavigate} />)}
                </div>
            );
        }
        const hasActive = s.items.some(isActive);
        const expanded = hasActive || open.includes(s.section);
        const id = `gestao-${s.section.toLowerCase().replace(/\W+/g, '-')}`;
        return (
            <div key={s.section} className={styles.group}>
                <button type="button" className={`${styles.group_btn} ${hasActive ? styles.group_active : ''}`} aria-expanded={expanded}
                    aria-controls={id} onClick={() => toggle(s.section)}>
                    <s.icon aria-hidden="true" /> <span>{s.section}</span>
                    <FiChevronDown className={`${styles.chevron} ${expanded ? styles.chevron_open : ''}`} aria-hidden="true" />
                </button>
                {expanded && <div id={id} className={styles.sub}>{s.items.map((item) => <MenuLink key={item.to} item={item} onNavigate={onNavigate} />)}</div>}
            </div>
        );
    });
}

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [me, setMe] = useState({ data: null, error: null, mfa: false });
    const [tick, setTick] = useState(0);
    // Fica no cadastro até a pessoa confirmar que guardou os códigos (o usuário passa a ter MFA no meio do fluxo)
    const [enrolling, setEnrolling] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        let alive = true;
        backofficeApi.me()
            .then((data) => alive && setMe({ data, error: null, mfa: false }))
            .catch((e) => alive && setMe(e?.response?.data?.code === 'mfa_required' ? { data: null, error: null, mfa: true } : { data: null, mfa: false, error: {
                403: 'Sua conta é da equipe, mas ainda não tem área (TI ou Financeiro) na Gestão Cadrius. Peça a um administrador.',
                428: 'Aceite os termos vigentes (janela aberta) para entrar na Gestão Cadrius.',
            }[e?.response?.status] || errorMessage(e) }));
        return () => { alive = false; };
    }, [tick]);

    const areas = me.data?.areas || [];
    return (
        <div className={styles.layout}>
            <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebar_open : ''}`} id="menu-gestao">
                <div className={styles.brand}><span className={styles.brand_name}><img src="/favicon.svg" alt="" width="24" height="24" /> Gestão Cadrius</span>
                    {menuOpen && <button type="button" className={styles.close_btn} onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><FiX /></button>}
                </div>
                <div className={styles.brand_sub}>Área interna da equipe Cadrius</div>
                <div className={styles.areas}>{areas.map((a) => <span key={a} className={styles.area}>{AREA_LABEL[a] || a}</span>)}</div>
                <nav className={styles.nav} aria-label="Menu da Gestão"><AdminMenu areas={areas} onNavigate={() => setMenuOpen(false)} /></nav>
                <div className={styles.spacer} />
                <Link to="/dashboard" className={styles.footer_btn}><FiArrowLeft /> Voltar ao app</Link>
                <button type="button" className={styles.footer_btn} onClick={async () => { await logout(); navigate('/', { replace: true }); }}>
                    <FiLogOut /> Sair
                </button>
            </aside>
            {menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />}
            <ConsentModal />
            <div className={styles.main}>
                <div className={styles.topbar}>
                    <button type="button" className={styles.menu_btn} onClick={() => setMenuOpen(true)} aria-label="Abrir menu"
                        aria-expanded={menuOpen} aria-controls="menu-gestao"><FiMenu /></button>
                    <span className={styles.topbar_note}><FiActivity /> Ambiente administrativo: toda ação fica registrada na trilha de auditoria.</span>
                    <span className={styles.topbar_right}><ThemeToggle /><span className={styles.topbar_email}>{user?.email}</span></span>
                </div>
                <main className={styles.body} id="conteudo">
                    {me.error && <div className={styles.denied}><h2>Sem acesso</h2><p>{me.error}</p></div>}
                    {me.mfa && (enrolling || !user?.mfa_enabled) && (
                        <MfaSetup onStart={() => setEnrolling(true)} onDone={() => { setMe({ data: null, error: null, mfa: false }); setEnrolling(false); setTick((t) => t + 1); }}
                            intro="A Gestão Cadrius exige verificação em duas etapas. Cadastre o aplicativo autenticador do seu celular para continuar." />
                    )}
                    {me.mfa && !enrolling && user?.mfa_enabled && (
                        <div className={styles.denied}><h2>Confirme a verificação em duas etapas</h2>
                            <p>Esta sessão começou antes do código. Saia e entre de novo com a senha e o código do aplicativo.</p>
                            <button type="button" className={styles.footer_btn} style={{ margin: '0 auto', color: 'var(--c-primary)' }}
                                onClick={async () => { await logout(); navigate('/', { replace: true }); }}>Sair e entrar de novo</button>
                        </div>
                    )}
                    {!me.error && !me.data && !me.mfa && <div className={styles.denied}>Carregando…</div>}
                    {me.data && <div className={styles.page_inner}><Outlet context={{ areas }} /></div>}
                </main>
            </div>
        </div>
    );
}
