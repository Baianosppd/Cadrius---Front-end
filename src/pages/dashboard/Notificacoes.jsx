import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
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
                    <PageHeader title="Notificações" subtitle="Acompanhe todas as atualizações do sistema" />
                    {notifications.some((n) => !n.read) && (
                        <button onClick={markAll} style={{ alignSelf: 'flex-end', margin: '0 0 12px', padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
                            Marcar todas como lidas
                        </button>
                    )}
                    {loading ? <p>Carregando…</p> : notifications.length === 0 ? <p style={{ color: '#6b7280' }}>Nenhuma notificação por enquanto.</p> : (
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
