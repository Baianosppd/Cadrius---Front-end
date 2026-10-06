import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, StatCard, StatusPill, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import { Conversa } from '../escritorio/Suporte';
import { PRIORITY, STAFF_STATUS, supportApi } from '../../services/support';
import useLoader from './useLoader';
import FilaParametrizacao from '../../components/suporte/FilaParametrizacao';

function Detalhe({ id, onBack }) {
    const { data, error, reload } = useLoader(() => supportApi.staffGet(id), [id]);
    const [text, setText] = useState('');
    const [internal, setInternal] = useState(false);
    const [busy, setBusy] = useState(false);
    const act = async (fn) => {
        setBusy(true);
        try { await fn(); setText(''); reload(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    return (
        <div className={styles.page}>
            <PageHeader title={`#${data.id} · ${data.subject}`} subtitle={`${data.organization} · ${data.opened_by} · ${data.category_label}${data.page_url ? ` · tela ${data.page_url}` : ''}`}
                actions={<button type="button" className={styles.btn} onClick={onBack}>Voltar à fila</button>} />
            <div className={styles.filters}>
                <label className={styles.field}>Situação
                    <select className={styles.select} value={data.status} onChange={(e) => act(() => supportApi.staffUpdate(id, { status: e.target.value }))}>
                        {Object.entries(STAFF_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
                <label className={styles.field}>Prioridade
                    <select className={styles.select} value={data.priority} onChange={(e) => act(() => supportApi.staffUpdate(id, { priority: e.target.value }))}>
                        {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
                <div className={styles.field}>Responsável<span>{data.assigned_to || '—'} <button type="button" className={styles.btn} onClick={() => act(() => supportApi.staffUpdate(id, { assign: 'me' }))}>Assumir</button></span></div>
            </div>
            {data.access_until
                ? <Banner tone="ok">O cliente autorizou acesso assistido (só leitura) até {fmtDateTime(data.access_until)}.</Banner>
                : <Banner tone="info">Sem acesso aos dados do escritório. Se precisar, peça ao cliente para autorizar no chamado.</Banner>}
            <Conversa messages={data.messages} staffView />
            {data.status !== 'fechado' && (
                <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <textarea className={styles.textarea} value={text} onChange={(e) => setText(e.target.value)} placeholder={internal ? 'Nota interna (o cliente não vê)' : 'Resposta ao cliente'} />
                    <label className={styles.check_row}><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Nota interna da equipe</label>
                    <div><button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || text.trim().length < 5}
                        onClick={() => act(() => supportApi.staffReply(id, text.trim(), internal))}>{internal ? 'Salvar nota' : 'Responder'}</button></div>
                </div>
            )}
        </div>
    );
}

export default function SuporteGestao() {
    const [filters, setFilters] = useState({ status: 'ativos', priority: '', mine: '' });
    const [current, setCurrent] = useState(null);
    const [view, setView] = useState('chamados');
    const { data, error, reload } = useLoader(() => supportApi.queue(filters), [filters.status, filters.priority, filters.mine, current]);
    if (current) return <Detalhe id={current} onBack={() => { setCurrent(null); reload(); }} />;
    const m = data?.metricas;
    const tabs = (
        <div className={styles.tabs} role="tablist">
            {[['chamados', 'Chamados'], ['param', 'Pedidos de parametrização']].map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={view === k} className={`${styles.tab} ${view === k ? styles.tab_active : ''}`} onClick={() => setView(k)}>{l}</button>
            ))}
        </div>
    );
    if (view === 'param') {
        return (
            <div className={styles.page}>
                <PageHeader title="Suporte" subtitle="Pedidos de parametrização dos escritórios: analisar, propor, executar e entregar" />
                {tabs}
                <FilaParametrizacao onOpenTicket={setCurrent} />
            </div>
        );
    }
    return (
        <div className={styles.page}>
            <PageHeader title="Suporte" subtitle="Chamados dos escritórios" />
            {tabs}
            {m && (
                <div className={styles.grid}>
                    <StatCard title="Abertos" value={m.abertos} />
                    <StatCard title="Sem 1ª resposta" value={m.sem_resposta} tone={m.sem_resposta ? 'yellow' : 'green'} />
                    <StatCard title="Urgentes" value={m.urgentes} tone={m.urgentes ? 'red' : undefined} />
                    <StatCard title="1ª resposta (média 30 dias)" value={m.primeira_resposta_media_horas_30d != null ? `${m.primeira_resposta_media_horas_30d} h` : '—'} />
                </div>
            )}
            <div className={styles.filters}>
                <label className={styles.field}>Situação
                    <select className={styles.select} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                        <option value="ativos">Ativos</option><option value="">Todos</option>
                        {Object.entries(STAFF_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
                <label className={styles.field}>Prioridade
                    <select className={styles.select} value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
                        <option value="">Todas</option>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
                <label className={styles.check_row} style={{ alignSelf: 'center' }}>
                    <input type="checkbox" checked={filters.mine === '1'} onChange={(e) => setFilters((f) => ({ ...f, mine: e.target.checked ? '1' : '' }))} /> Só os meus</label>
            </div>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Carregando…</Empty>}
            {data && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Chamado</th><th>Escritório</th><th>Prioridade</th><th>Situação</th><th>Responsável</th><th>Atualizado</th></tr></thead>
                        <tbody>
                            {data.resultados.length === 0 && <tr><td colSpan={6}><Empty>Nenhum chamado.</Empty></td></tr>}
                            {data.resultados.map((t) => (
                                <tr key={t.id} onClick={() => setCurrent(t.id)} style={{ cursor: 'pointer' }}>
                                    <td><strong>#{t.id} · {t.subject}</strong><div className={styles.muted}>{t.category_label}{!t.first_response_at ? ' · sem resposta' : ''}</div></td>
                                    <td>{t.organization}<div className={styles.muted}>{t.opened_by}</div></td>
                                    <td><StatusPill map={PRIORITY} value={t.priority} /></td>
                                    <td><StatusPill map={STAFF_STATUS} value={t.status} /></td>
                                    <td>{t.assigned_to || '—'}</td>
                                    <td>{fmtDateTime(t.updated_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
