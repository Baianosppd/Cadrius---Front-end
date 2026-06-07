import React from 'react';
import { FiBell, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styles from './BarraSup.module.css';
import Title from '../ui/Title';
import Button from '../ui/Button';

function BarraSup({ nome, fotoUrl }) {
    const navigate = useNavigate();

    return (
        <header className={styles.barra_superior}>
            <div></div>

            <div className={styles.actions_container}>
                <button
                    className={styles.icon_button_notification}
                    aria-label="Notificações"
                    onClick={() => navigate('/notificacoes')}
                >
                    <FiBell size={20} />
                    <span className={styles.badge}>4</span>
                </button>

                <div
                    className={styles.user_profile}
                    onClick={() => navigate('/perfil')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className={styles.avatar_wrapper}>
                        <img src={fotoUrl} alt="Perfil" className={styles.avatar_img} />
                        <span className={styles.status_indicator}></span>
                    </div>
                    <div className={styles.user_info_trigger}>
                        <span className={styles.user_name}>{nome}</span>
                        <FiChevronDown className={styles.chevron} />
                    </div>
                </div>
            </div>
        </header>
    );
}

export default BarraSup;