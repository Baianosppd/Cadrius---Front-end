import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../../../hooks/useAuth';
import { Loading, PageHeader, Tabs } from '../../../components/ui';
import { errorMessage } from '../../../utils/format';
import api from '../../../services/api.js';
import styles from '../../../components/ui/ui.module.css';
import SummaryGroup from '../../../components/painel/SummaryGroup.jsx';
import AutomationToolbar from '../../../components/automacao/AutomationToolbar.jsx';
import AutomationList from '../../../components/automacao/AutomationList.jsx';
import { FiFileText, FiZap, FiMail } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import RegrasTab from '../../../components/automacao/RegrasTab.jsx';
import ConformidadeTab from '../../../components/automacao/ConformidadeTab.jsx';
import ExecucoesTab from '../../../components/automacao/ExecucoesTab.jsx';

// Abas (CAD-172): fluxos com apps externos (webhooks) e regras internas do escritório, com aprovação e histórico
// 95 → "1 h 35 min"; 0 → "0 min"
const fmtMinutes = (m) => { const h = Math.floor((m || 0) / 60); const r = (m || 0) % 60; return h ? `${h} h${r ? ` ${r} min` : ''}` : `${r} min`; };

const TABS = [['regras', 'Regras do escritório'], ['fluxos', 'Fluxos com apps'], ['aprovacoes', 'Aprovações'], ['historico', 'Histórico'],
    ['conformidade', 'Conformidade']];

function Automacao() {
    const [search, setSearch] = useState('');
    const [automationStats, setAutomationStats] = useState(null);
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isOrgManager, role, access } = useAuth();
    const [params, setParams] = useSearchParams();
    // CAD-227: começa pelas Regras (onde ficam as automações da IA e dos modelos prontos)
    const tab = TABS.some(([k]) => k === params.get('aba')) ? params.get('aba') : 'regras';

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
        { icon: FiFileText, iconColor: 'var(--c-info)', title: 'Automações ativas', value: automationStats ? String(automationStats.automacoes_ativas) : '—' },
        { icon: FiZap, iconColor: 'var(--c-warning)', title: 'Total de execuções', value: automationStats ? String(automationStats.total_execucoes) : '—' },
        { icon: FiMail, iconColor: 'var(--c-success)', title: 'Tempo economizado (estimado)', value: automationStats ? fmtMinutes(automationStats.tempo_economizado_min ?? automationStats.tempo_economizado * 60) : '—' },
    ];

    return (
        <div className={styles.page}>
            <PageHeader title="Automações" subtitle="O trabalho repetitivo, feito por regras" />
            <SummaryGroup stats={stats} />
            <Tabs tabs={TABS.map(([id, label]) => ({ id, label }))} value={tab} onChange={(k) => setParams({ aba: k })} />
            {tab === 'regras' && <RegrasTab canManage={isOrgManager || !!access?.permissoes?.includes('automacoes.gerir')} />}
            {tab === 'aprovacoes' && <ExecucoesTab pendentes canApprove={role !== 'VIEWER'} />}
            {tab === 'historico' && <ExecucoesTab pendentes={false} />}
            {tab === 'conformidade' && <ConformidadeTab />}
            {tab === 'fluxos' && (<>
            <AutomationToolbar search={search} onSearchChange={setSearch} />
            {loading ? <Loading /> : (
                <AutomationList
                    workflows={workflows}
                    search={search}
                    canManage={isOrgManager}
                    onToggle={(w) => run(() => api.patch(`workflows/${w.id}/`, { is_active: !w.is_active }), w.is_active ? 'Automação desativada.' : 'Automação ativada.')}
                    onApprove={(w) => run(() => api.post(`workflows/${w.id}/approve/`), 'Automação aprovada e ativada.')}
                    onReject={(w) => window.confirm('Descartar este rascunho da IA?') && run(() => api.post(`workflows/${w.id}/reject/`), 'Rascunho descartado.')}
                    onDelete={(w) => window.confirm(`Excluir "${w.name}"?`) && run(() => api.delete(`workflows/${w.id}/`), 'Automação excluída.')}
                />
            )}
            </>)}
        </div>
    );
}

export default Automacao;
