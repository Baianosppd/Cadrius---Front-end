// src/components/pages/Integracoes.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styles from './Integracoes.module.css';

// Modais de configuração (só os que o backend já suporta hoje)
import MailboxModal from '../../components/common/MailboxModal';
import AIProfileModal from '../../components/common/AIProfileModal';
// import CredentialModal from '../../components/common/CredentialModal'; // Telegram/Trello: aguardando CRUD de AppConnection no backend

import { SiOpenai, SiWhatsapp } from 'react-icons/si';
import { FiMail, FiHardDrive } from 'react-icons/fi';

import PageHeader from '../../components/ui/PageHearder.jsx';
import IntegrationGrid from '../../components/ui/Cards/IntegrationGrid.jsx';
import SyncHistory from '../../components/ui/SyncHistory.jsx';

function Integracoes() {

    // Qual modal está aberto no momento: 'mailbox' | 'aiProfile' | null
    const [activeModal, setActiveModal] = useState(null);
    const closeModal = () => setActiveModal(null);

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

const history = [
    {
        name: 'Histórico de sincronização',
        description: 'O histórico aparecerá aqui assim que a sincronização com o backend for concluída.',
        time: '',
        status: 'sucesso',
    },
];

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
        status: 'desconectado',
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

    // Injeta o onAction em cada card sem sujar o array original
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