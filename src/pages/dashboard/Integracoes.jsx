// src/components/pages/Integracoes.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Integracoes.module.css';

// Importação de todos os Modais de Configuração
//import CredentialModal from '../../components/common/CredentialModal';
//import MailboxModal from '../../components/common/MailboxModal';
//import AIProfileModal from '../../components/common/AIProfileModal';

import { SiOpenai, SiWhatsapp } from 'react-icons/si';
import { FiMail, FiHardDrive } from 'react-icons/fi';

import PageHeader from '../../components/ui/PageHearder.jsx';
import IntegrationGrid from '../../components/ui/Cards/IntegrationGrid.jsx';
import SyncHistory from '../../components/ui/SyncHistory.jsx';

function Integracoes() {

    //Retirar consts quando conectar com o banco
const history = [
    { name: 'OpenAI', description: 'Última sincronização bem sucedida - 45 documentos analisados', time: '3 min atrás', status: 'sucesso' },
    { name: 'Gmail', description: '12 novos e-mails processados', time: '13 min atrás', status: 'sucesso' },
    { name: 'WhatsApp', description: 'Falha na conexão - reconecte sua conta', time: '1 hora atrás', status: 'erro' },
    { name: 'OpenAI', description: '45 documentos analisados', time: '2 horas atrás', status: 'sucesso' },
];

const integrations = [
    {
        name: 'OpenAI',
        status: 'conectado',
        description: 'Processamento de linguagem natural com GPT-4',
        syncInfo: '3 min atrás - Última sincronização bem sucedida',
        logo: SiOpenai,
        logoColor: '#10a37f',
        logoBg: '#f0fdf4',
    },
    {
        name: 'Gmail',
        status: 'conectado',
        description: 'Sincronização de e-mails via IMAP',
        syncInfo: '13 min atrás - 12 novos e-mails processados',
        logo: FiMail,
        logoColor: '#ea4335',
        logoBg: '#fef2f2',
    },
    {
        name: 'Google Drive',
        status: 'desconectado',
        description: 'Armazenamento e sincronização de documentos',
        syncInfo: '13 min atrás - 12 novos e-mails processados',
        logo: FiHardDrive,
        logoColor: '#4285f4',
        logoBg: '#eff6ff',
    },
    {
        name: 'WhatsApp Business',
        status: 'conectado',
        description: 'Comunicação com clientes',
        syncInfo: '5 min atrás - Última sincronização bem sucedida',
        logo: SiWhatsapp,
        logoColor: '#25d366',
        logoBg: '#f0fdf4',
    },
    {
        name: 'Astrea',
        status: 'desconectado',
        description: 'Consulta processual',
        syncInfo: '13 min atrás - 12 novos e-mails processados',
        logo: 'A', // Nao tenho logo
        logoBg: '#3b82f6',
    },
    {
        name: 'Projuris',
        status: 'desconectado',
        description: 'Gestão de processos jurídicos',
        syncInfo: '13 min atrás - 12 novos e-mails processados',
        logo: 'P', // Nao tenho logo
        logoBg: '#8b5cf6',
    },
];

    return (
        <div className={styles.integracoes_container}>

           <PageHeader title="Integrações" subtitle="Conecte suas ferramentas favoritas ao Cadrius" />
            <IntegrationGrid integrations={integrations} />
            <SyncHistory history={history} />
        </div>

    );
}

export default Integracoes;