import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FiHome,
    FiMail,
    FiZap,
    FiLayers,
    FiSettings,
    FiLogOut,
    FiShield,
    FiCpu,
    FiLock,
    FiActivity,
    FiDollarSign
} from 'react-icons/fi'; // Importando ícones modernos
import styles from './Navbar.module.css';

import Title from '../ui/Title';

import useAuth from '../../hooks/useAuth';

function Navbar() {

    const { logout, isOrgManager, isStaff } = useAuth();
    const navigate = useNavigate();

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
                <li className={`${styles.nav_item} ${isActive('/automacao')}`}>
                    <Link to="/automacao">
                        <FiZap className={styles.nav_icon} />
                        <span className={styles.nav_text}>Automações</span>
                    </Link>
                </li>


                {/* Equipe */}
                <li className={`${styles.nav_item} ${isActive('/equipe')}`}>
                    <Link to="/equipe">
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

                {/* Privacidade (todos) */}
                <li className={`${styles.nav_item} ${isActive('/privacidade')}`}>
                    <Link to="/privacidade">
                        <FiLock className={styles.nav_icon} />
                        <span className={styles.nav_text}>Privacidade</span>
                    </Link>
                </li>

                {/* IA segura (todos veem a política; donos/admins gerenciam) */}
                <li className={`${styles.nav_item} ${isActive('/ia')}`}>
                    <Link to="/ia">
                        <FiCpu className={styles.nav_icon} />
                        <span className={styles.nav_text}>IA segura</span>
                    </Link>
                </li>

                {/* Auditoria do escritório (donos e administradores) */}
                {isOrgManager && (
                    <li className={`${styles.nav_item} ${isActive('/auditoria')}`}>
                        <Link to="/auditoria">
                            <FiActivity className={styles.nav_icon} />
                            <span className={styles.nav_text}>Auditoria</span>
                        </Link>
                    </li>
                )}

                {/* Financeiro (equipe Cadrius): preços, promoções e informes */}
                {isStaff && (
                    <li className={`${styles.nav_item} ${isActive('/financeiro')}`}>
                        <Link to="/financeiro">
                            <FiDollarSign className={styles.nav_icon} />
                            <span className={styles.nav_text}>Financeiro</span>
                        </Link>
                    </li>
                )}

                {/* Centro de Segurança (equipe Cadrius) */}
                {isStaff && (
                    <li className={`${styles.nav_item} ${isActive('/seguranca')}`}>
                        <Link to="/seguranca">
                            <FiShield className={styles.nav_icon} />
                            <span className={styles.nav_text}>Centro de Segurança</span>
                        </Link>
                    </li>
                )}

            </ul>

            {/* 2. Rodapé da Sidebar - Logout */}
            <div className={styles.sidebar_footer}>
                <button
                    type="button"
                    className={styles.logout_link}
                    onClick={async () => { await logout(); navigate('/', { replace: true }); }}
                >
                    <FiLogOut className={styles.nav_icon} />
                    <span className={styles.nav_text}>Sair</span>
                </button>
            </div>
        </nav>
    );
}

export default Navbar;