import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Automacao.module.css';

import PageHeader from '../../components/ui/PageHearder.jsx';
import SummaryGroup from '../../components/ui/Cards/SummaryGroup.jsx';
import AutomationToolbar from '../../components/ui/AutomationToolbar.jsx';
import AutomationList from '../../components/ui/AutomationList.jsx';
import { FiFileText, FiZap, FiMail } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function Automacao() {
    const [search, setSearch] = useState('');
    const [automationStats, setAutomationStats] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/automations/stats/')
            .then(res => setAutomationStats(res.data))
            .catch(err => console.error('Erro ao carregar stats:', err));
    }, []);

    const stats = [
        { icon: FiFileText, iconColor: '#3b82f6', title: 'Automações ativas', value: automationStats ? String(automationStats.automacoes_ativas) : '—' },
        { icon: FiZap, iconColor: '#f59e0b', title: 'Total de execuções', value: automationStats ? String(automationStats.total_execucoes) : '—' },
        { icon: FiMail, iconColor: '#10b981', title: 'Tempo economizado', value: automationStats ? String(automationStats.tempo_economizado) : '—' },
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
                onCreateClick={() => navigate('/editor')}
            />
            <AutomationList automations={automations} search={search} />
        </div>
    );
}

export default Automacao;