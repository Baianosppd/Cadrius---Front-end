// src/components/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Dashboard.module.css';

import Card from '../../components/ui/Card';
import Atividades from '../../components/common/Atividades';
import QuickActions from '../../components/common/QuickActions';






function Dashboard() {
    // 1. Estado das Estatísticas
    const [stats, setStats] = useState({
        automacoes_ativas: 0,
        processos_ativos: 0,
        prazos_hoje: 0,
        tempo_economizado: "0h"
    });

    // 2. Estado das Atividades Recentes
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                // A. Carrega Estatísticas
                const statsRes = await api.get('dashboard/stats/');
                setStats(statsRes.data);

                // B. Carrega Atividades Recentes (Lista de E-mails)
                const emailsRes = await api.get('emails/');
                // O DRF retorna { results: [...] } na paginação
                const emails = emailsRes.data.results || emailsRes.data;

                // Pega os 5 primeiros e mapeia para o visual do componente Atividades
                const mappedActivities = emails.slice(0, 5).map(email => {
                    let title, desc, color, icon;

                    // Define visual baseado no status do processamento
                    switch (email.status) {
                        case 'INTEGRATED':
                            title = 'Integração Concluída';
                            desc = `Dados enviados: ${email.subject.substring(0, 30)}...`;
                            color = 'blue';
                            icon = 'check-circle';
                            break;
                        case 'EXTRACTED':
                            title = 'Dados Extraídos';
                            desc = `IA processou: ${email.subject.substring(0, 30)}...`;
                            color = 'green';
                            icon = 'file-text';
                            break;
                        case 'FAILED':
                            title = 'Falha no Processo';
                            desc = `Erro ao ler: ${email.subject.substring(0, 30)}...`;
                            color = 'purple'; // Usando purple como alerta visual
                            icon = 'alert-triangle';
                            break;
                        default: // PENDING, PROCESSING, REVIEW
                            title = 'Novo E-mail Recebido';
                            desc = `Aguardando: ${email.subject.substring(0, 30)}...`;
                            color = 'yellow';
                            icon = 'mail';
                    }

                    return {
                        title,
                        description: desc,
                        // Formata a data para mostrar hora
                        time: new Date(email.received_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        color,
                        icon
                    };
                });

                setRecentActivities(mappedActivities);

            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error);
            }
        }

        loadDashboardData();
    }, []);

    return (
        <div className={styles.dashboard_container}>

            {/* Título */}
            <div className={styles.page_intro}>
                <h2>Dashboard</h2>
                <p>Bem-vindo de volta, seu painel está atualizado.</p>
            </div>

            {/* 1. Grid de Estatísticas */}
            <div className={styles.stats_grid}>
                <Card
                    type="stat"
                    titulo="Automações Ativas"
                    num={stats.automacoes_ativas}
                    obs="Em execução"
                    color="blue"
                    icon="zap"
                />
                <Card
                    type="stat"
                    titulo="Processos Ativos"
                    num={stats.processos_ativos}
                    obs="Extraídos pela IA"
                    color="green"
                    icon="file-text"
                />
                <Card
                    type="stat"
                    titulo="E-mails Hoje"
                    num={stats.prazos_hoje}
                    obs="Recebidos hoje"
                    color="purple"
                    icon="clock"
                />
                <Card
                    type="stat"
                    titulo="Tempo Economizado"
                    num={stats.tempo_economizado}
                    obs="Estimativa total"
                    color="yellow"
                    icon="watch"
                />
            </div>

            {/* 2. Grid Principal: Atividades e Ações */}
            <div className={styles.main_grid_layout}>

                {/* Lado Esquerdo: Atividades Recentes (Dinâmico) */}
                <Atividades data={recentActivities} />

                {/* Lado Direito: Ações Rápidas (Funcional) */}
                <div className={styles.sidebar}>
                    <QuickActions />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;