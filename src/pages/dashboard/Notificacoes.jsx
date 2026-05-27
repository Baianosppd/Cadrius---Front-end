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
    
    //Retirar consts quando conectar com o banco
const [selectedNotification, setSelectedNotification] = useState(null);

    const notifications = [
        {
            title: 'Documento analisado com sucesso',
            description: 'Petição Inicial - Caso Silva foi processada e os prazos foram extraídos.',
            time: 'Há 20 minutos',
            read: false,
            type: 'documento',
            origem: 'Módulo de Documentos',
            documento: 'Petição Inicial - Caso Silva.pdf',
            acao: 'Análise concluída com sucesso',
            detalhes: 'Foram extraídos 3 prazos importantes e 2 cláusulas críticas identificadas.',
            actionLabel: 'Ir para Módulo de Documentos',
            link: '/documentos',
        },
        {
            title: 'Prazo próximo identificado',
            description: 'Contestação para o processo 1234.56.789 vence em 5 dias.',
            time: 'Há 2 horas',
            read: false,
            type: 'prazo',
            origem: 'Módulo de Prazos',
            documento: 'Contestação 1234.56.789',
            acao: 'Prazo identificado automaticamente',
            detalhes: 'O prazo vence em 5 dias. Tome as providências necessárias.',
            actionLabel: 'Ver Prazo',
            link: '/prazos',
        },
        {
            title: 'Nova automação concluída',
            description: 'Email enviado automaticamente para a cliente Maria Santos.',
            time: 'Há 3 horas',
            read: true,
            type: 'automacao',
            origem: 'Módulo de Automações',
            documento: '—',
            acao: 'Email enviado com sucesso',
            detalhes: 'A automação de envio de email foi concluída com sucesso.',
            actionLabel: 'Ver Automações',
            link: '/automacoes',
        },
        {
            title: 'Falha na sincronização',
            description: 'Não foi possível sincronizar com Google Drive. Tente reconectar.',
            time: 'Há 4 horas',
            read: true,
            type: 'erro',
            origem: 'Google Drive',
            documento: '—',
            acao: 'Falha na conexão',
            detalhes: 'Não foi possível sincronizar com Google Drive. Tente reconectar sua conta.',
            actionLabel: 'Ir para Integrações',
            link: '/integracoes',
        },
        {
            title: 'Novo documento carregado',
            description: 'Contrato de Prestação de Serviços foi enviado com sucesso.',
            time: 'Há 5 horas',
            read: true,
            type: 'documento',
            origem: 'Módulo de Documentos',
            documento: 'Contrato de Prestação de Serviços.pdf',
            acao: 'Upload concluído',
            detalhes: 'O documento foi carregado e está disponível para análise.',
            actionLabel: 'Ir para Módulo de Documentos',
            link: '/documentos',
        },
    ];
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