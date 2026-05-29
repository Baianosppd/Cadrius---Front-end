// src/components/pages/Automacao.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Automacao.module.css';

import PageHeader from '../../components/ui/PageHearder.jsx';
import SummaryGroup from '../../components/ui/Cards/SummaryGroup.jsx';
import AutomationToolbar from '../../components/ui/AutomationToolbar.jsx';
import AutomationList from '../../components/ui/AutomationList.jsx';
import { FiFileText, FiZap, FiMail } from 'react-icons/fi';

function Automacao() {

    const [search, setSearch] = useState('');

    const stats = [
            { icon: FiFileText, iconColor: '#3b82f6', title: 'Automações ativas', value: '4' },
            { icon: FiZap, iconColor: '#f59e0b', title: 'Total de execuções', value: '627' },
            { icon: FiMail, iconColor: '#10b981', title: 'Tempo economizado', value: '47' },
        ];

    const automations = [
        { name: 'Triagem Inicial de Processos', trigger: 'Novo PDF', active: true, successRate: 98, lastExecution: 'Há 5 min' },
        { name: 'Extração de Prazos Processuais', trigger: 'Documento Analisado', active: true, successRate: 95, lastExecution: 'Há 2 horas' },
        { name: 'Sincronização com Google Calendar', trigger: 'Prazo Identificado', active: false, successRate: 100, lastExecution: 'Há 1 dia' },
        { name: 'Notificação de Intimações', trigger: 'E-mail Recebido', active: true, successRate: 92, lastExecution: 'Há 10 min' },
];

    return (
        <div className={styles.automacao_container}>

            <PageHeader title="Automação de fluxo de trabalho" subtitle="Imagine um subtitulo aqui" />
            <SummaryGroup stats={stats} />
            <AutomationToolbar
                search={search}
                onSearchChange={setSearch}
                onCreateClick={() => {}}
            />
            <AutomationList automations={automations} search={search} />
        </div>
    );
}

export default Automacao;