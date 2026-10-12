import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import styles from '../../../components/ui/ui.module.css';
import { auditLabel } from '../../../services/auditLabels';
import { ALERT_STATUS, Banner, Button, Empty, Field, FilterBar, Input, Loading, OUTCOME, PageHeader, Row, SEVERITY, Select, Stack, StatCard, StatusPill, Table, Tabs } from '../../../components/ui';
import { fmtDateTime, errorMessage } from '../../../utils/format';

const PREFIXES = [
    ['', 'Todas as ações'], ['auth.', 'Acesso (login, logout)'], ['workflow.', 'Automações'], ['ai.', 'IA'],
    ['data.', 'Dados e exportações'], ['consent.', 'Consentimento'], ['org.', 'Escritório'], ['permission.', 'Permissões negadas'],
];
const PAGE_SIZE = 10; // igual ao PAGE_SIZE do back (DRF)
const TABS = [{ id: 'resumo', label: 'Resumo' }, { id: 'eventos', label: 'Eventos' }, { id: 'alertas', label: 'Alertas' }];

function Resumo() {
    const [s, setS] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => { api.get('audit/summary/').then((r) => setS(r.data)).catch((e) => setError(errorMessage(e))); }, []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!s) return <Loading />;
    return (
        <Stack>
            <div className={styles.grid}>
                <StatCard title={`Eventos (${s.window_days} dias)`} value={s.total_events} />
                <StatCard title="Logins com falha" value={s.failed_logins} tone={s.failed_logins > 10 ? 'red' : undefined} />
                <StatCard title="Acessos negados" value={s.denied} tone={s.denied > 0 ? 'yellow' : undefined} />
                <StatCard title="Exportações" value={s.exports} />
                <StatCard title="Alertas abertos" value={s.open_alerts} tone={s.open_alerts > 0 ? 'red' : 'green'} />
            </div>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Ações mais frequentes</div>
            <div className={styles.card}>
                {Object.keys(s.by_action).length === 0 ? <Empty /> : Object.entries(s.by_action).map(([action, n]) => (
                    <div key={action} className={styles.kv}><span title={action}>{auditLabel(action)}</span><strong>{n}</strong></div>
                ))}
            </div>
        </Stack>
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
        <Stack>
            <FilterBar>
                <Field label="Tipo de ação">
                    <Select value={filters.prefix} onChange={set('prefix')}>{PREFIXES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
                </Field>
                <Field label="Resultado">
                    <Select value={filters.outcome} onChange={set('outcome')}>
                        <option value="">Todos</option><option value="success">Sucesso</option><option value="denied">Negado</option><option value="error">Erro</option>
                    </Select>
                </Field>
                <Field label="De"><Input type="date" value={filters.from} onChange={set('from')} /></Field>
                <Field label="Até"><Input type="date" value={filters.to} onChange={set('to')} /></Field>
                <Button onClick={exportCsv}>Exportar CSV</Button>
            </FilterBar>
            {error && <Banner tone="error">{error}</Banner>}
            <Table columns={['#', 'Quando', 'Quem', 'Ação', 'Alvo', 'Resultado', 'IP', 'Motivo']}
                empty={!loading && rows.length === 0 && <Empty>Nenhum evento para esses filtros.</Empty>}>
                {rows.map((e) => (
                    <tr key={e.seq}>
                        <td className={styles.mono}>{e.seq}</td><td data-label="Quando">{fmtDateTime(e.occurred_at)}</td>
                        <td data-label="Quem">{e.actor_label || e.actor_type}</td><td data-label="Ação" title={e.action}>{auditLabel(e.action)}</td>
                        <td data-label="Alvo" className={styles.muted}>{e.target_type ? `${e.target_type} ${e.target_id}` : '—'}</td>
                        <td data-label="Resultado"><StatusPill map={OUTCOME} value={e.outcome} /></td>
                        <td data-label="IP" className={styles.mono}>{e.ip || '—'}</td><td data-label="Motivo" className={styles.muted}>{e.reason || '—'}</td>
                    </tr>
                ))}
            </Table>
            <Row justify="center">
                <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <span className={styles.muted}>Página {page} de {pages} ({count} eventos)</span>
                <Button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </Row>
        </Stack>
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
        <Stack>
            <FilterBar>
                <Field label="Situação">
                    <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="open">Abertos</option><option value="ack">Em análise</option>
                        <option value="resolved">Resolvidos</option><option value="false_positive">Falsos positivos</option><option value="">Todos</option>
                    </Select>
                </Field>
            </FilterBar>
            {error && <Banner tone="error">{error}</Banner>}
            {alerts.length === 0 ? <Empty>Nenhum alerta {status === 'open' ? 'aberto — tudo tranquilo' : 'encontrado'}.</Empty> : (
                <Table columns={['Quando', 'Severidade', 'Regra', 'Resumo', 'Usuário', 'Situação', 'Triagem']}>
                    {alerts.map((a) => (
                        <tr key={a.id}>
                            <td>{fmtDateTime(a.created_at)}</td><td data-label="Severidade"><StatusPill map={SEVERITY} value={a.severity} /></td>
                            <td data-label="Regra" className={styles.mono}>{a.rule}</td><td data-label="Resumo">{a.summary}</td><td data-label="Usuário">{a.actor_label || '—'}</td>
                            <td data-label="Situação"><StatusPill map={ALERT_STATUS} value={a.status} /></td>
                            <td data-label="Triagem">
                                <Row gap={1}>
                                    {a.status === 'open' && <Button size="sm" onClick={() => triage(a.id, 'ack')}>Analisar</Button>}
                                    {a.status !== 'resolved' && <Button size="sm" variant="primary" onClick={() => triage(a.id, 'resolved')}>Resolver</Button>}
                                    {a.status !== 'false_positive' && <Button size="sm" variant="ghost" onClick={() => triage(a.id, 'false_positive')}>Falso positivo</Button>}
                                </Row>
                            </td>
                        </tr>
                    ))}
                </Table>
            )}
        </Stack>
    );
}

export default function Auditoria() {
    const [tab, setTab] = useState('resumo');
    return (
        <div className={styles.page}>
            <PageHeader title="Auditoria" subtitle="Quem fez o quê, quando e de onde" />
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
            {tab === 'resumo' && <Resumo />}
            {tab === 'eventos' && <Eventos />}
            {tab === 'alertas' && <Alertas />}
        </div>
    );
}
