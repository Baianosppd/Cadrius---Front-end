import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { errorMessage } from '../../components/seguranca/ui';
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
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isOrgManager } = useAuth();

    const load = useCallback(async () => {
        try {
            // A API é paginada (10 por página): junta todas as páginas
            let url = 'workflows/';
            const all = [];
            while (url) {
                const { data } = await api.get(url);
                all.push(...(data.results ?? data));
                url = data.next ? data.next.replace(/^.*\/api\/v1\//, '') : null;
            }
            setWorkflows(all);
        } catch (err) {
            toast.error(errorMessage(err, 'Não foi possível carregar as automações.'));
        } finally {
            setLoading(false);
        }
        api.get('/automations/stats/').then(res => setAutomationStats(res.data)).catch(() => {});
    }, []);

    useEffect(() => { load(); }, [load]);

    const run = async (fn, okMsg) => {
        try { await fn(); toast.success(okMsg); await load(); } catch (err) { toast.error(errorMessage(err)); }
    };

    const stats = [
        { icon: FiFileText, iconColor: '#3b82f6', title: 'Automações ativas', value: automationStats ? String(automationStats.automacoes_ativas) : '—' },
        { icon: FiZap, iconColor: '#f59e0b', title: 'Total de execuções', value: automationStats ? String(automationStats.total_execucoes) : '—' },
        { icon: FiMail, iconColor: '#10b981', title: 'Tempo economizado', value: automationStats ? String(automationStats.tempo_economizado) : '—' },
    ];

    return (
        <div className={styles.automacao_container}>
            <PageHeader title="Automação de fluxo de trabalho" subtitle="Crie, ative e acompanhe as automações do escritório" />
            <SummaryGroup stats={stats} />
            <AutomationToolbar
                search={search}
                onSearchChange={setSearch}
                onCreateClick={() => navigate('/editor')}
            />
            {loading ? <p style={{ padding: 16 }}>Carregando…</p> : (
                <AutomationList
                    workflows={workflows}
                    search={search}
                    canManage={isOrgManager}
                    onToggle={(w) => run(() => api.patch(`workflows/${w.id}/`, { is_active: !w.is_active }), w.is_active ? 'Automação desativada.' : 'Automação ativada.')}
                    onEdit={(w) => navigate(`/editor?id=${w.id}`)}
                    onApprove={(w) => run(() => api.post(`workflows/${w.id}/approve/`), 'Automação aprovada e ativada.')}
                    onReject={(w) => window.confirm('Descartar este rascunho da IA?') && run(() => api.post(`workflows/${w.id}/reject/`), 'Rascunho descartado.')}
                    onDelete={(w) => window.confirm(`Excluir "${w.name}"?`) && run(() => api.delete(`workflows/${w.id}/`), 'Automação excluída.')}
                />
            )}
        </div>
    );
}

export default Automacao;
