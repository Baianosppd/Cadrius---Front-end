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

    // A listagem real de automações ainda não é puxada do backend.
    const automations = [
        {
            name: 'Listagem de automações em desenvolvimento',
            trigger: 'aguardando integração com o backend',
            active: false,
            successRate: 0,
            lastExecution: '—',
        },
    ];

    return (
        <div className={styles.automacao_container}>
            <PageHeader title="Automação de fluxo de trabalho" subtitle="Crie e gerencie seus fluxos de trabalho automatizados" />
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