import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import TabBar from '../../components/ui/TabBar';
import styles from '../../components/seguranca/seguranca.module.css';
import {
    ALERT_STATUS, Banner, Empty, OUTCOME, PageHeader, SEVERITY, StatCard, StatusPill, fmtDateTime, errorMessage,
} from '../../components/seguranca/ui';

const PREFIXES = [
    ['', 'Todas as ações'], ['auth.', 'Acesso (login, logout)'], ['workflow.', 'Automações'], ['ai.', 'IA'],
    ['data.', 'Dados e exportações'], ['consent.', 'Consentimento'], ['org.', 'Escritório'], ['permission.', 'Permissões negadas'],
];
const PAGE_SIZE = 10; // igual ao PAGE_SIZE do back (DRF)

function Resumo() {
    const [s, setS] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => { api.get('audit/summary/').then((r) => setS(r.data)).catch((e) => setError(errorMessage(e))); }, []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!s) return <Empty>Carregando…</Empty>;
    return (
        <div className={styles.page}>
            <div className={styles.grid}>
                <StatCard title={`Eventos (${s.window_days} dias)`} value={s.total_events} />
                <StatCard title="Logins com falha" value={s.failed_logins} tone={s.failed_logins > 10 ? 'red' : undefined} />
                <StatCard title="Acessos negados" value={s.denied} tone={s.denied > 0 ? 'yellow' : undefined} />
                <StatCard title="Exportações" value={s.exports} />
                <StatCard title="Alertas abertos" value={s.open_alerts} tone={s.open_alerts > 0 ? 'red' : 'green'} />
            </div>
            <div className={styles.section_title}>Ações mais frequentes</div>
            <div className={styles.card}>
                {Object.keys(s.by_action).length === 0 ? <Empty /> : Object.entries(s.by_action).map(([action, n]) => (
                    <div key={action} className={styles.kv}><span className={styles.mono}>{action}</span><strong>{n}</strong></div>
                ))}
            </div>
        </div>
    );
}

function Eventos() {
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ prefix: '', outcome: '', from: '', to: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const params = useCallback((extra = {}) => {
        const p = { ...extra };
        if (filters.prefix) p.prefix = filters.prefix;
        if (filters.outcome) p.outcome = filters.outcome;
        if (filters.from) p.from = new Date(filters.from).toISOString();
        if (filters.to) p.to = new Date(`${filters.to}T23:59:59`).toISOString();
        return p;
    }, [filters]);

    useEffect(() => {
        api.get('audit/events/', { params: params({ page }) })
            .then((r) => { setRows(r.data.results ?? r.data); setCount(r.data.count ?? (r.data.results ?? r.data).length); setError(null); })
            .catch((e) => setError(errorMessage(e)))
            .finally(() => setLoading(false));
    }, [params, page]);

    const set = (k) => (e) => { setPage(1); setFilters((f) => ({ ...f, [k]: e.target.value })); };

    const exportCsv = async () => {
        try {
            const r = await api.get('audit/events/export/', { params: params(), responseType: 'blob' });
            const url = URL.createObjectURL(r.data);
            const a = document.createElement('a'); a.href = url; a.download = 'auditoria.csv'; a.click();
            URL.revokeObjectURL(url);
        } catch (e) { toast.error(errorMessage(e)); }
    };

    const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    return (
        <div className={styles.page}>
            <div className={styles.filters}>
                <label className={styles.field}>Tipo de ação
                    <select className={styles.select} value={filters.prefix} onChange={set('prefix')}>{PREFIXES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                </label>
                <label className={styles.field}>Resultado
                    <select className={styles.select} value={filters.outcome} onChange={set('outcome')}>
                        <option value="">Todos</option><option value="success">Sucesso</option><option value="denied">Negado</option><option value="error">Erro</option>
                    </select>
                </label>
                <label className={styles.field}>De<input type="date" className={styles.input} value={filters.from} onChange={set('from')} /></label>
                <label className={styles.field}>Até<input type="date" className={styles.input} value={filters.to} onChange={set('to')} /></label>
                <button className={styles.btn} onClick={exportCsv}>Exportar CSV</button>
            </div>
            {error && <Banner tone="error">{error}</Banner>}
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>#</th><th>Quando</th><th>Quem</th><th>Ação</th><th>Alvo</th><th>Resultado</th><th>IP</th><th>Motivo</th></tr></thead>
                    <tbody>
                        {rows.map((e) => (
                            <tr key={e.seq}>
                                <td className={styles.mono}>{e.seq}</td><td>{fmtDateTime(e.occurred_at)}</td>
                                <td>{e.actor_label || e.actor_type}</td><td className={styles.mono}>{e.action}</td>
                                <td className={styles.muted}>{e.target_type ? `${e.target_type} ${e.target_id}` : '—'}</td>
                                <td><StatusPill map={OUTCOME} value={e.outcome} /></td>
                                <td className={styles.mono}>{e.ip || '—'}</td><td className={styles.muted}>{e.reason || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && rows.length === 0 && <Empty>Nenhum evento para esses filtros.</Empty>}
            </div>
            <div className={styles.pager}>
                <button className={styles.btn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
                <span>Página {page} de {pages} ({count} eventos)</span>
                <button className={styles.btn} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Próxima</button>
            </div>
        </div>
    );
}

function Alertas() {
    const [alerts, setAlerts] = useState([]);
    const [status, setStatus] = useState('open');
    const [error, setError] = useState(null);

    const load = useCallback(() => {
        api.get('audit/alerts/', { params: status ? { status } : {} })
            .then((r) => { setAlerts(r.data.results ?? r.data); setError(null); })
            .catch((e) => setError(errorMessage(e)));
    }, [status]);
    useEffect(() => { load(); }, [load]);

    const triage = async (id, next) => {
        try { await api.patch(`audit/alerts/${id}/`, { status: next }); toast.success('Alerta atualizado.'); load(); }
        catch (e) { toast.error(errorMessage(e)); }
    };

    return (
        <div className={styles.page}>
            <div className={styles.filters}>
                <label className={styles.field}>Situação
                    <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="open">Abertos</option><option value="ack">Em análise</option>
                        <option value="resolved">Resolvidos</option><option value="false_positive">Falsos positivos</option><option value="">Todos</option>
                    </select>
                </label>
            </div>
            {error && <Banner tone="error">{error}</Banner>}
            {alerts.length === 0 ? <Empty>Nenhum alerta {status === 'open' ? 'aberto — tudo tranquilo' : 'encontrado'}.</Empty> : (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Quando</th><th>Severidade</th><th>Regra</th><th>Resumo</th><th>Usuário</th><th>Situação</th><th>Triagem</th></tr></thead>
                        <tbody>
                            {alerts.map((a) => (
                                <tr key={a.id}>
                                    <td>{fmtDateTime(a.created_at)}</td><td><StatusPill map={SEVERITY} value={a.severity} /></td>
                                    <td className={styles.mono}>{a.rule}</td><td>{a.summary}</td><td>{a.actor_label || '—'}</td>
                                    <td><StatusPill map={ALERT_STATUS} value={a.status} /></td>
                                    <td>
                                        <div className={styles.btn_row}>
                                            {a.status === 'open' && <button className={styles.btn} onClick={() => triage(a.id, 'ack')}>Analisar</button>}
                                            {a.status !== 'resolved' && <button className={styles.btn} onClick={() => triage(a.id, 'resolved')}>Resolver</button>}
                                            {a.status !== 'false_positive' && <button className={styles.btn} onClick={() => triage(a.id, 'false_positive')}>Falso positivo</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function Auditoria() {
    const [tab, setTab] = useState('resumo');
    return (
        <div className={styles.page}>
            <PageHeader title="Auditoria do escritório" subtitle="Quem fez o quê, quando e de onde" />
            <TabBar tabs={[{ id: 'resumo', label: 'Resumo' }, { id: 'eventos', label: 'Eventos' }, { id: 'alertas', label: 'Alertas' }]} activeTab={tab} onTabChange={setTab} />
            {tab === 'resumo' && <Resumo />}
            {tab === 'eventos' && <Eventos />}
            {tab === 'alertas' && <Alertas />}
        </div>
    );
}
