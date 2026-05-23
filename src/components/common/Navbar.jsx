import { Link, useLocation } from 'react-router-dom';
import {
    FiHome,
    FiMail,
    FiZap,
    FiLayers,
    FiSettings,
    FiLogOut
} from 'react-icons/fi'; // Importando ícones modernos
import styles from './Navbar.module.css';

import Title from '../ui/Title';

import useAuth from '../../hooks/useAuth';

function Navbar() {

    const { logout } = useAuth();

    const location = useLocation();

    const isActive = (path) => {
        return location.pathname.startsWith(path) ? styles.active : '';
    };



    return (
        <nav className={styles.sidebar}>
            {/* NOVO: Título Cadrius no topo da Sidebar */}
            <div className={styles.logo_container}>
                <Title as="h1" className={styles.sidebar_title}>
                    Cadrius
                </Title>
            </div>

            {/* 1. Lista de Navegação Principal */}
            <ul className={styles.nav_list}>

                {/* Dashboard */}
                <li className={`${styles.nav_item} ${isActive('/dashboard')}`}>
                    <Link to="/dashboard">
                        <FiHome className={styles.nav_icon} />
                        <span className={styles.nav_text}>Dashboard</span>
                    </Link>
                </li>

                {/* Caixa de Entrada IA */}
                <li className={`${styles.nav_item} ${isActive('/documents')}`}>
                    <Link to="/documents">
                        <FiMail className={styles.nav_icon} />
                        <span className={styles.nav_text}>Documentos</span>
                    </Link>
                </li>

                {/* Automações */}
                <li className={`${styles.nav_item} ${isActive('/underconstruction')}`}>
                    <Link to="/underconstruction">
                        <FiZap className={styles.nav_icon} />
                        <span className={styles.nav_text}>Automações</span>
                    </Link>
                </li>


                {/* Mensagens */}
                <li className={`${styles.nav_item} ${isActive('/underconstruction')}`}>
                    <Link to="/underconstruction">
                        <FiSettings className={styles.nav_icon} />
                        <span className={styles.nav_text}>Mensagens</span>
                    </Link>
                </li>

                {/* Equipe */}
                <li className={`${styles.nav_item} ${isActive('/underconstruction')}`}>
                    <Link to="/underconstruction">
                        <FiSettings className={styles.nav_icon} />
                        <span className={styles.nav_text}>equipe</span>
                    </Link>
                </li>

                {/* Integrações */}
                <li className={`${styles.nav_item} ${isActive('/integracoes')}`}>
                    <Link to="/integracoes">
                        <FiLayers className={styles.nav_icon} />
                        <span className={styles.nav_text}>Integrações</span>
                    </Link>
                </li>

                {/* Configurações */}
                <li className={`${styles.nav_item} ${isActive('/underconstruction')}`}>
                    <Link to="/underconstruction">
                        <FiSettings className={styles.nav_icon} />
                        <span className={styles.nav_text}>Configurações</span>
                    </Link>
                </li>

            </ul>

            {/* 2. Rodapé da Sidebar - Logout */}
            <div className={styles.sidebar_footer}>
                <Link
                    to="/login"
                    className={styles.logout_link}
                    onClick={logout}
                >
                    <FiLogOut className={styles.nav_icon} />
                    <span className={styles.nav_text}>Sair</span>
                </Link>
            </div>
        </nav>
    );
}

export default Navbar;