// src/components/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Dashboard.module.css';

import Card from '../../components/ui/Card';
import Atividades from '../../components/common/Atividades';
import QuickActions from '../../components/common/QuickActions';

import StatsCard from '../../components/ui/Cards/StatCard.jsx';
import TasksDay from '../../components/ui/Cards/TasksDay.jsx';
import RecentProcesses from '../../components/ui/Cards/RecentProcesses.jsx';

//Adições dos componentes utilizados agora
import PageHeader from '../../components/ui/PageHearder.jsx';
import ActionButton from '../../components/ui/ActionButton';
import SummaryGroup from '../../components/ui/Cards/SummaryGroup.jsx';
import TasksToday from '../../components/ui/TasksToday';
import SmartActivities from '../../components/ui/SmartActivities';

//Import icones
import { FiFileText, FiZap, FiMail } from 'react-icons/fi';


import useAuth from '../../hooks/useAuth';


import { useNavigate } from 'react-router-dom';

function Dashboard() {

    const { user } = useAuth();

    const navigate = useNavigate();

    //Essa porrada de const é temporario só até puxar do banco depois
    const stats = [
        { icon: FiFileText, iconColor: '#3b82f6', title: 'Total de Documentos', value: '1.234' },
        { icon: FiZap, iconColor: '#f59e0b', title: 'Automações Rodadas', value: '856' },
        { icon: FiMail, iconColor: '#10b981', title: 'Mensagens Enviadas', value: '3.421' },
    ];

    const [tasks, setTasks] = useState([
        { id: 1, description: 'Responder petição Silva vs ABC Corp', time: '09:00', priority: 'alta', completed: false },
        { id: 2, description: 'Revisar contrato - Cliente Oliveira', time: '11:30', priority: 'media', completed: false },
        { id: 3, description: 'Reunião com equipe - Caso XYZ', time: '14:00', priority: 'baixa', completed: false },
        { id: 4, description: 'Enviar documentação para cliente Santos', time: '16:30', priority: 'alta', completed: false },
    ])

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