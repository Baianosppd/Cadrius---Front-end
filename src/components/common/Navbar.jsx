// USE APENAS ESTA LINHA PARA IMPORTAR TUDO:
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css'

import logo from '../../img/cadrius_sf.png'

function Navbar() {
    const location = useLocation();

    // Função auxiliar para verificar se o caminho do link é o caminho atual
    const isActive = (path) => {
        return location.pathname.startsWith(path)
            ? styles.active
            : '';
    };

    return (
        // O restante do seu JSX (nav, logo, lista, etc.)
        <nav className={styles.navbar}>

            {/* 1. Área do Logo no Topo */}
            <div className={styles.logo_area}>
                <div className={styles.logo_box}>
                    <img
                        src={logo}
                        alt="Logo Cadrius"
                        className={styles.logo}
                    />
                </div>
            </div>

            {/* 2. Lista de Navegação (Links) */}
            <ul className={styles.list}>

                {/* Dashboard */}
                <li className={`${styles.item} ${isActive('/dashboard')}`}>
                    <Link to="/dashboard">
                        <i data-feather="home" className={styles.icon}></i>
                        <span className={styles.text}>Dashboard</span>
                    </Link>
                </li>

                {/* Automações */}
                <li className={`${styles.item} ${isActive('/automacao')}`}>
                    <Link to="/automacao">
                        <i data-feather="zap" className={styles.icon}></i>
                        <span className={styles.text}>Automações</span>
                    </Link>
                </li>

                {/* Processos */}
                <li className={`${styles.item} ${isActive('/processos')}`}>
                    <Link to="/processos">
                        <i data-feather="activity" className={styles.icon}></i>
                        <span className={styles.text}>Processos</span>
                    </Link>
                </li>

                {/* Comunicação */}
                <li className={`${styles.item} ${isActive('/comunicacao')}`}>
                    <Link to="/comunicacao">
                        <i data-feather="mail" className={styles.icon}></i>
                        <span className={styles.text}>Comunicação</span>
                    </Link>
                </li>

                {/* Integrações */}
                <li className={`${styles.item} ${isActive('/integracoes')}`}>
                    <Link to="/integracoes">
                        <i data-feather="settings" className={styles.icon}></i>
                        <span className={styles.text}>Integrações</span>
                    </Link>
                </li>
            </ul>

            {/* 3. Área do Perfil no Rodapé */}
            <div className={styles.profile_area}>
                <Link to="/perfil">
                    <i data-feather="user" className={styles.profile_icon}></i>
                </Link>
            </div>

        </nav>
    )
}

export default Navbar