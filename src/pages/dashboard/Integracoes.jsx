// src/components/pages/Integracoes.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import styles from './Integracoes.module.css';
import api from '../../services/api.js';

import MailboxModal from '../../components/common/MailboxModal';
import AIProfileModal from '../../components/common/AIProfileModal';
// import CredentialModal from '../../components/common/CredentialModal'; // Telegram/Trello: aguardando CRUD de AppConnection no backend

import { SiOpenai, SiWhatsapp, SiTelegram } from 'react-icons/si';
import { FiMail, FiHardDrive, FiCalendar } from 'react-icons/fi';

import PageHeader from '../../components/ui/PageHearder.jsx';
import IntegrationGrid from '../../components/ui/Cards/IntegrationGrid.jsx';
import SyncHistory from '../../components/ui/SyncHistory.jsx';

function Integracoes() {

    //  modal está aberto: 'mailbox' | 'aiProfile' | null
    const [activeModal, setActiveModal] = useState(null);
    const closeModal = () => setActiveModal(null);

    const [gmailConectado, setGmailConectado] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        api.get('mailboxes/')
            .then(res => {
                const mailboxes = res.data.results ?? res.data;
                setGmailConectado(mailboxes.length > 0);
            })
            .catch(() => { });

        api.get('sync-history/')
            .then(res => {
                const items = res.data.results ?? res.data;
                setHistory(items.map(item => ({
                    name: item.title,
                    description: item.description,
                    time: item.time,
                    status: item.status === 'falha' ? 'erro' : 'sucesso',
                })));
            })
            .catch(() => { });
    }, []);

    // O que cada botão "Conectar/Configurar" faz, indexado pelo nome do card.
    // Quem não estiver aqui cai no aviso de "ainda não disponível".
    const acoesPorIntegracao = {
        Gmail: () => setActiveModal('mailbox'),
        OpenAI: () => setActiveModal('aiProfile'),
    };
    const integracaoIndisponivel = () => toast.info('Integração ainda não disponível.');

    // Dados placeholder: a listagem real e o status de cada integração dependem de
    // um endpoint de status/sincronização que ainda precisa ser concluído no backend.
    const PENDENTE_BACKEND = 'Sincronização em desenvolvimento — aguardando conclusão no backend.';

    const integrations = [
        {
            name: 'OpenAI',
            status: 'desconectado',
            description: 'Processamento de linguagem natural com GPT-4',
            syncInfo: PENDENTE_BACKEND,
            logo: SiOpenai,
            logoColor: '#10a37f',
            logoBg: '#f0fdf4',
        },
        {
            name: 'Gmail',
            status: gmailConectado ? 'conectado' : 'desconectado',
            description: 'Sincronização de e-mails via IMAP',
            syncInfo: PENDENTE_BACKEND,
            logo: FiMail,
            logoColor: '#ea4335',
            logoBg: '#fef2f2',
        },
        {
            name: 'Google Drive',
            status: 'desconectado',
            description: 'Armazenamento e sincronização de documentos',
            syncInfo: PENDENTE_BACKEND,
            logo: FiHardDrive,
            logoColor: '#4285f4',
            logoBg: '#eff6ff',
        },
        {
            name: 'WhatsApp Business',
            status: 'desconectado',
            description: 'Comunicação com clientes',
            syncInfo: PENDENTE_BACKEND,
            logo: SiWhatsapp,
            logoColor: '#25d366',
            logoBg: '#f0fdf4',
        },
        {
            name: 'Calendário',
            status: 'desconectado',
            description: 'Sincronização de prazos e tarefas com o calendário',
            syncInfo: PENDENTE_BACKEND,
            logo: FiCalendar,
            logoColor: '#f59e0b',
            logoBg: '#fffbeb',
        },
        {
            name: 'Telegram',
            status: 'desconectado',
            description: 'Notificações e mensagens via Telegram',
            syncInfo: PENDENTE_BACKEND,
            logo: SiTelegram,
            logoColor: '#26a5e4',
            logoBg: '#eff6ff',
        },
        {
            name: 'Astrea',
            status: 'desconectado',
            description: 'Consulta processual',
            syncInfo: PENDENTE_BACKEND,
            logo: 'A', // Nao tenho logo
            logoBg: '#3b82f6',
        },
        {
            name: 'Projuris',
            status: 'desconectado',
            description: 'Gestão de processos jurídicos',
            syncInfo: PENDENTE_BACKEND,
            logo: 'P', // Nao tenho logo
            logoBg: '#8b5cf6',
        },
    ];


    const integrationsComAcao = integrations.map((item) => ({
        ...item,
        onAction: acoesPorIntegracao[item.name] || integracaoIndisponivel,
    }));

    return (
        <div className={styles.integracoes_container}>

            <PageHeader title="Integrações" subtitle="Conecte suas ferramentas favoritas ao Cadrius" />
            <IntegrationGrid integrations={integrationsComAcao} />
            <SyncHistory history={history} />

            <MailboxModal
                isOpen={activeModal === 'mailbox'}
                onClose={closeModal}
                onSuccess={closeModal}
            />
            <AIProfileModal
                isOpen={activeModal === 'aiProfile'}
                onClose={closeModal}
                onSuccess={closeModal}
            />
        </div>

    );
}

export default Integracoes;