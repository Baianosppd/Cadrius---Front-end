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
import { toast } from 'react-toastify';

function Dashboard() {
    const navigate = useNavigate();
    const [dashStats, setDashStats] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        api.get('/dashboard/stats/')
            .then(res => setDashStats(res.data))
            .catch(err => console.error('Erro ao carregar stats:', err));

        api.get('activities/')
            .then(res => setActivities(res.data))
            .catch(err => console.error('Erro ao carregar atividades:', err));

        api.get('tasks/')
            .then(res => setTasks(res.data))
            .catch(err => console.error('Erro ao carregar tarefas:', err));
    }, []);

    const stats = [
        { icon: FiFileText, iconColor: '#3b82f6', title: 'Total de Documentos', value: dashStats ? String(dashStats.total_documentos) : '—' },
        { icon: FiZap, iconColor: '#f59e0b', title: 'Automações Rodadas', value: dashStats ? String(dashStats.automacoes_rodadas) : '—' },
        { icon: FiMail, iconColor: '#10b981', title: 'Mensagens Enviadas', value: dashStats ? String(dashStats.mensagens_enviadas) : '—' },
    ];

    const handleToggle = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        try {
            const response = await api.patch(`tasks/${id}/`, { completed: !task.completed });
            setTasks(prev => prev.map(t => t.id === id ? response.data : t));
        } catch (err) {
            toast.error('Erro ao atualizar tarefa.');
        }
    };

    return (
        <div className={styles.dashboard_container}>
            <PageHeader title="Painel" subtitle="O resumo do dia: tarefas, documentos e o que a IA preparou" />

            <div className={styles.actions_row}>
                <ActionButton icon={FiFileText} label="Analisar documento" variant="primary" onClick={() => navigate('/documents')} />
                <ActionButton icon={FiZap} label="Nova automação" variant="secondary" onClick={() => navigate('/automacao')} />
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