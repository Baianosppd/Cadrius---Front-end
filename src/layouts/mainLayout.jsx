import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import BarraSup from '../components/common/BarraSup';
import NavBar from '../components/common/Navbar';
import styles from './MainLayout.module.css';
import useAuth from '../hooks/useAuth';
import ConsentModal from '../components/seguranca/ConsentModal';
import SubscriptionBanner from '../components/common/SubscriptionBanner';
import CommandPalette from '../components/common/CommandPalette';
import ModuleTour from '../components/common/ModuleTour';

// Layout do escritório (CAD-174): menu fixo no computador; no celular/tablet vira gaveta aberta pelo botão ☰
export default function MainLayout() {
    const { user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const nome = user?.first_name || user?.email;

    useEffect(() => {
        if (!menuOpen) return undefined;
        const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [menuOpen]);

    return (
        <div className={styles.layout_container}>
            <aside className={`${styles.sidebar_area} ${menuOpen ? styles.sidebar_open : ''}`} id="menu-principal">
                <NavBar onNavigate={() => setMenuOpen(false)} onClose={menuOpen ? () => setMenuOpen(false) : undefined} />
            </aside>
            {menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />}
            <div className={styles.main_content}>
                <BarraSup nome={nome} onMenu={() => setMenuOpen(true)} menuOpen={menuOpen} />
                <SubscriptionBanner />
                <ConsentModal />
                <main className={styles.page_body} id="conteudo">
                    <div className={styles.page_inner}><Outlet /></div>
                    <CommandPalette />
                    <ModuleTour />
                </main>
            </div>
        </div>
    );
}
