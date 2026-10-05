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
    FiCheckCircle,
    FiUsers,
    FiUpload,
    FiHelpCircle
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
                {/* Fase B (CAD-171): contatos e importação de planilhas */}
                <li className={`${styles.nav_item} ${isActive('/contatos')}`}>
                    <Link to="/contatos">
                        <FiUsers className={styles.nav_icon} />
                        <span className={styles.nav_text}>Contatos</span>
                    </Link>
                </li>
                <li className={`${styles.nav_item} ${isActive('/importar')}`}>
                    <Link to="/importar">
                        <FiUpload className={styles.nav_icon} />
                        <span className={styles.nav_text}>Importar dados</span>
                    </Link>
                </li>

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

                {/* IA do escritório: aprovações, autonomia, regras e memória (CAD-165) */}
                <li className={`${styles.nav_item} ${isActive('/aprovacoes')}`}>
                    <Link to="/aprovacoes">
                        <FiCheckCircle className={styles.nav_icon} />
                        <span className={styles.nav_text}>IA do escritório</span>
                    </Link>
                </li>

                {/* Suporte com a equipe Cadrius (CAD-171): leva a tela atual para o chamado */}
                <li className={`${styles.nav_item} ${isActive('/suporte')}`}>
                    <Link to={`/suporte${location.pathname.startsWith('/suporte') ? '' : `?novo=1&de=${encodeURIComponent(location.pathname)}`}`}>
                        <FiHelpCircle className={styles.nav_icon} />
                        <span className={styles.nav_text}>Ajuda e suporte</span>
                    </Link>
                </li>

                {/* Gestão Cadrius (equipe): TI e Financeiro em área própria (CAD-168) */}
                {isStaff && (
                    <li className={`${styles.nav_item} ${isActive('/gestao')}`}>
                        <Link to="/gestao">
                            <FiShield className={styles.nav_icon} />
                            <span className={styles.nav_text}>Gestão Cadrius</span>
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