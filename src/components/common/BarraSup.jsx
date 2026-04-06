import React from 'react';
import { FiBell, FiChevronDown } from 'react-icons/fi';
import styles from './BarraSup.module.css';

import Title from '../ui/Title';
import Button from '../ui/Button';

function BarraSup({ nome, fotoUrl }) {
    return (
        <header className={styles.barra_superior}>
            {/* Lado Esquerdo*/}
            <div>
            </div>

            {/* Lado Direito:*/}
            <div className={styles.actions_container}>

                {/* Notificações -*/}
                <button className={styles.icon_button_notification} aria-label="Notificações">
                    <FiBell size={20} />
                    <span className={styles.badge}>4</span>
                </button>

                {/* Perfil do Usuário */}
                <div className={styles.user_profile}>
                    {/* Foto do usuário*/}
                    <div className={styles.avatar_wrapper}>

                        <img src={fotoUrl} alt="Perfil" className={styles.avatar_img} />

                        <span className={styles.status_indicator}></span>

                    </div>

                    <div className={styles.user_info_trigger}>
                        <span className={styles.user_name}>{nome || 'John Doe'}</span>
                        <FiChevronDown className={styles.chevron} />
                    </div>
                </div>
            </div>
        </header>
    );
}

export default BarraSup;