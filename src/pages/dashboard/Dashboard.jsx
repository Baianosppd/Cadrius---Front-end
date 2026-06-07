import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Dashboard.module.css';

import PageHeader from '../../components/ui/PageHearder.jsx';
import ActionButton from '../../components/ui/ActionButton';
import SummaryGroup from '../../components/ui/Cards/SummaryGroup.jsx';
import TasksToday from '../../components/ui/TasksToday';
import SmartActivities from '../../components/ui/SmartActivities';

import { FiFileText, FiZap, FiMail } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();
    const [dashStats, setDashStats] = useState(null);


    useEffect(() => {
        api.get('/dashboard/stats/')
            .then(res => {
                console.log('Stats:', res.data);
                setDashStats(res.data);
            })
            .catch(err => console.error('Erro ao carregar stats:', err));
    }, []);

    useEffect(() => {
        api.get('/dashboard/stats/')
            .then(res => setDashStats(res.data))
            .catch(err => console.error('Erro ao carregar stats:', err));
    }, []);

    const stats = [
        { icon: FiFileText, iconColor: '#3b82f6', title: 'Total de Documentos', value: dashStats ? String(dashStats.total_documentos) : '—' },
        { icon: FiZap, iconColor: '#f59e0b', title: 'Automações Rodadas', value: dashStats ? String(dashStats.automacoes_rodadas) : '—' },
        { icon: FiMail, iconColor: '#10b981', title: 'Mensagens Enviadas', value: dashStats ? String(dashStats.mensagens_enviadas) : '—' },
    ];

    const [tasks, setTasks] = useState([
        { id: 1, description: 'Responder petição Silva vs ABC Corp', time: '09:00', priority: 'alta', completed: false },
        { id: 2, description: 'Revisar contrato - Cliente Oliveira', time: '11:30', priority: 'media', completed: false },
        { id: 3, description: 'Reunião com equipe - Caso XYZ', time: '14:00', priority: 'baixa', completed: false },
        { id: 4, description: 'Enviar documentação para cliente Santos', time: '16:30', priority: 'alta', completed: false },
    ]);

    const handleToggle = (id) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const activities = [
        { title: 'Documento analisado com sucesso', description: 'Petição Inicial - Caso Silva foi processada e os prazos foram extraídos.', time: 'Há 20 minutos', type: 'success' },
        { title: 'Prazo próximo identificado', description: 'Contestação para o processo 1234.56.789 vence em 5 dias.', time: 'Há 2 horas', type: 'warning' },
        { title: 'Nova automação concluída', description: 'Email enviado automaticamente para a cliente Maria Santos.', time: 'Há 3 horas', type: 'success' },
        { title: 'Falha na sincronização', description: 'Não foi possível sincronizar com Google Drive. Tente reconectar.', time: 'Há 5 horas', type: 'error' },
    ];

    return (
        <div className={styles.dashboard_container}>
            <PageHeader title="Dashboard" subtitle="Visão geral das suas atividades" />

            <div className={styles.actions_row}>
                <ActionButton icon={FiFileText} label="Nova Análise de Documento" variant="primary" onClick={() => navigate('/documents')} />
                <ActionButton icon={FiZap} label="Criar Novo Fluxo de Automação" variant="secondary" onClick={() => navigate('/automacao')} />
            </div>

            <SummaryGroup stats={stats} />

            <div className={styles.bottom_row}>
                <TasksToday
                    tasks={tasks}
                    onToggleTask={handleToggle}
                    onAddTask={() => navigate('/newtask')}
                />
                <SmartActivities activities={activities} />
            </div>
        </div>
    );
}

export default Dashboard;