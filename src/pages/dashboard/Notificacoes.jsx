import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import ui from '../../components/seguranca/seguranca.module.css';
import styles from './Notificacoes.module.css';
import { NOTIFICATIONS_CHANGED } from '../../components/common/BarraSup.jsx';

import PageHeader from '../../components/ui/PageHearder.jsx';
import NotificationList from '../../components/ui/NotificationList.jsx';
import NotificationDetail from '../../components/ui/NotificationDetails.jsx';

function Notificacoes() {
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        api.get('notifications/')
            .then((r) => setNotifications(r.data.results ?? r.data))
            .catch(() => toast.error('Não foi possível carregar as notificações.'))
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => { load(); }, [load]);

    const open = async (n) => {
        setSelectedNotification(n);
        if (!n.read) {
            try {
                await api.post(`notifications/${n.id}/read/`);
                setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
            } catch { /* leitura é best-effort */ }
        }
    };

    const markAll = async () => {
        try {
            await api.post('notifications/read-all/');
            setNotifications((list) => list.map((x) => ({ ...x, read: true })));
            window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
        } catch { toast.error('Não foi possível marcar como lidas.'); }
    };

    return (
        <div className={styles.Notificacoes_container}>
            {!selectedNotification ? (
                <>
                    <PageHeader title="Notificações" subtitle="Acompanhe todas as atualizações do sistema"
                        actions={notifications.some((n) => !n.read) && <button type="button" className={ui.btn} onClick={markAll}>Marcar todas como lidas</button>} />
                    {loading ? <p className={ui.muted}>Carregando…</p> : notifications.length === 0 ? <div className={ui.empty}>Nenhuma notificação por enquanto.</div> : (
                        <NotificationList notifications={notifications} onSelect={open} />
                    )}
                </>
            ) : (
                <NotificationDetail
                    notification={selectedNotification}
                    onBack={() => setSelectedNotification(null)}
                />
            )}
        </div>
    );
}

export default Notificacoes;
