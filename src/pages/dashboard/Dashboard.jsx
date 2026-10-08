import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api.js';
import styles from './Dashboard.module.css';

import PageHeader from '../../components/ui/PageHearder.jsx';
import ActionButton from '../../components/ui/ActionButton';
import SummaryGroup from '../../components/ui/Cards/SummaryGroup.jsx';
import TasksToday from '../../components/ui/TasksToday';
import SmartActivities from '../../components/ui/SmartActivities';

import { FiFileText, FiZap, FiMail, FiToggleRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import FirstSteps from '../../components/painel/FirstSteps';
import useAuth from '../../hooks/useAuth';
import usePaymentReturn from '../../hooks/usePaymentReturn';
import { greeting, todayLabel } from '../../services/onboarding';

function Dashboard() {
    usePaymentReturn();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dashStats, setDashStats] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [activities, setActivities] = useState([]);

    // CAD-230: o painel se atualiza sozinho (a cada minuto e ao voltar para a aba), sem precisar recarregar a página
    const load = useCallback(() => {
        api.get('/dashboard/stats/')
            .then(res => setDashStats(res.data))
            .catch(err => console.error('Erro ao carregar stats:', err));
        api.get('activities/')
            .then(res => setActivities(res.data))
            .catch(err => console.error('Erro ao carregar atividades:', err));
        api.get('tasks/', { params: { periodo: 'painel' } })
            .then(res => setTasks(res.data))
            .catch(err => console.error('Erro ao carregar tarefas:', err));
    }, []);

    useEffect(() => {
        load();
        const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 60000);
        const onVisible = () => { if (document.visibilityState === 'visible') load(); };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onVisible);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onVisible);
        };
    }, [load]);

    const num = (key) => (dashStats ? String(dashStats[key] ?? 0) : '—');
    const stats = [
        { icon: FiFileText, iconColor: '#3b82f6', title: 'Documentos', value: num('total_documentos') },
        { icon: FiToggleRight, iconColor: '#8b5cf6', title: 'Automações ativas', value: num('automacoes_ativas') },
        { icon: FiZap, iconColor: '#f59e0b', title: 'Automações rodadas', value: num('automacoes_rodadas') },
        { icon: FiMail, iconColor: '#10b981', title: 'Mensagens enviadas', value: num('mensagens_enviadas') },
    ];

    const handleToggle = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        try {
            const response = await api.patch(`tasks/${id}/`, { completed: !task.completed });
            setTasks(prev => prev.map(t => t.id === id ? response.data : t));
            api.get('/dashboard/stats/').then(res => setDashStats(res.data)).catch(() => {});
        } catch (err) {
            toast.error('Erro ao atualizar tarefa.');
        }
    };

    return (
        <div className={styles.dashboard_container}>
            <PageHeader title={`${greeting()}${user?.first_name ? `, ${user.first_name}` : ""}`} subtitle={todayLabel()} />

            <FirstSteps totalDocs={dashStats ? Number(dashStats.total_documentos || 0) : undefined} />

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