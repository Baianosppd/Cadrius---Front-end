// src/components/pages/Integracoes.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Notificacoes.module.css';

import { SiOpenai, SiWhatsapp } from 'react-icons/si';
import { FiMail, FiHardDrive } from 'react-icons/fi';

import PageHeader from '../../components/ui/PageHearder.jsx';
import NotificationList from '../../components/ui/NotificationList.jsx';
import NotificationDetail from '../../components/ui/NotificationDetails.jsx';

function Notificacoes() {
    
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        api.get('notifications/')
            .then(res => setNotifications(res.data.results ?? res.data))
            .catch(err => console.error('Erro ao carregar notificações:', err));
    }, []);

    return (
        <div className={styles.Notificacoes_container}>
            {!selectedNotification ? (
                <>
                    <PageHeader title="Notificações" subtitle="Acompanhe todas as atualizações do sistema" />
                    <NotificationList
                        notifications={notifications}
                        onSelect={(notification) => setSelectedNotification(notification)}
                    />
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