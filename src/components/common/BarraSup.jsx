import React, { useCallback, useEffect, useState } from 'react';
import { FiBell, FiChevronDown, FiMenu } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styles from './BarraSup.module.css';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

// Disparado quando o usuário lê notificações (atualiza o número do sino sem esperar o polling)
// eslint-disable-next-line react-refresh/only-export-components
export const NOTIFICATIONS_CHANGED = 'cadrius:notifications-changed';

function BarraSup({ nome, onMenu, menuOpen }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [unread, setUnread] = useState(0);

    const loadUnread = useCallback(() => {
        api.get('notifications/unread-count/').then((r) => setUnread(r.data.unread ?? r.data.count ?? 0)).catch(() => {});
    }, []);

    useEffect(() => {
        loadUnread();
        const timer = setInterval(loadUnread, 60000);
        window.addEventListener(NOTIFICATIONS_CHANGED, loadUnread);
        return () => { clearInterval(timer); window.removeEventListener(NOTIFICATIONS_CHANGED, loadUnread); };
    }, [loadUnread]);

    return (
        <header className={styles.barra_superior}>
            <div className={styles.left}>
                {onMenu && (
                    <button type="button" className={styles.menu_button} onClick={onMenu} aria-label="Abrir menu"
                        aria-expanded={!!menuOpen} aria-controls="menu-principal">
                        <FiMenu size={22} />
                    </button>
                )}
                <span className={styles.brand_mobile}>Cadrius</span>
            </div>

            <div className={styles.actions_container}>
                <button
                    className={styles.icon_button_notification}
                    aria-label="Notificações"
                    onClick={() => navigate('/notificacoes')}
                >
                    <FiBell size={20} />
                    {unread > 0 && <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
                </button>

                <div
                    className={styles.user_profile}
                    onClick={() => navigate('/perfil')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className={styles.avatar_wrapper}>
                        {user?.profile_picture ? (
                            <img src={user.profile_picture} alt="Perfil" className={styles.avatar_img} />
                        ) : (
                            <div className={styles.avatar_img} aria-label="Perfil" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
                                {user?.initials || '?'}
                            </div>
                        )}
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