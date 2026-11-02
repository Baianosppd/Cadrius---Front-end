import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import styles from '../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Empty, Field, FilterBar, Loading, PageHeader, Select, Stack, StatCard, StatusPill, Table, Tabs, Textarea } from '../../components/ui';
import { errorMessage, fmtDateTime } from '../../utils/format';
import Conversa from '../../components/suporte/Conversa';
import { PRIORITY, STAFF_STATUS, supportApi } from '../../services/support';
import useLoader from '../../hooks/useLoader';
import FilaParametrizacao from '../../components/suporte/FilaParametrizacao';

const TABS = [{ id: 'chamados', label: 'Chamados' }, { id: 'param', label: 'Pedidos de parametrização' }];

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
    if (!data) return <Loading />;
    return (
        <div className={styles.page}>
            <PageHeader title={`#${data.id} · ${data.subject}`} subtitle={`${data.organization} · ${data.opened_by} · ${data.category_label}${data.page_url ? ` · tela ${data.page_url}` : ''}`}
                actions={<Button icon={FiArrowLeft} onClick={onBack}>Voltar à fila</Button>} />
            <FilterBar>
                <Field label="Situação">
                    <Select value={data.status} onChange={(e) => act(() => supportApi.staffUpdate(id, { status: e.target.value }))}>
                        {Object.entries(STAFF_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                </Field>
                <Field label="Prioridade">
                    <Select value={data.priority} onChange={(e) => act(() => supportApi.staffUpdate(id, { priority: e.target.value }))}>
                        {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                </Field>
                <Stack gap={1}>
                    <span className={styles.text_sm}>Responsável</span>
                    <span>{data.assigned_to || '—'} <Button size="sm" disabled={busy} onClick={() => act(() => supportApi.staffUpdate(id, { assign: 'me' }))}>Assumir</Button></span>
                </Stack>
            </FilterBar>
            {data.access_until
                ? <Banner tone="ok">O cliente autorizou acesso assistido (só leitura) até {fmtDateTime(data.access_until)}.</Banner>
                : <Banner tone="info">Sem acesso aos dados do escritório. Se precisar, peça ao cliente para autorizar no chamado.</Banner>}
            <Conversa messages={data.messages} staffView />
            {data.status !== 'fechado' && (
                <Stack gap={2} className={styles.card}>
                    <Textarea value={text} onChange={(e) => setText(e.target.value)} aria-label={internal ? 'Nota interna' : 'Resposta ao cliente'}
                        placeholder={internal ? 'Nota interna (o cliente não vê)' : 'Resposta ao cliente'} />
                    <Checkbox checked={internal} onChange={(e) => setInternal(e.target.checked)}>Nota interna da equipe</Checkbox>
                    <Button variant="primary" className={styles.w_fit} loading={busy} disabled={text.trim().length < 5}
                        onClick={() => act(() => supportApi.staffReply(id, text.trim(), internal))}>{internal ? 'Salvar nota' : 'Responder'}</Button>
                </Stack>
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
    const tabs = <Tabs tabs={TABS} value={view} onChange={setView} />;
    if (view === 'param') {
        return (
            <div className={styles.page}>
                <PageHeader title="Suporte" subtitle="Pedidos de parametrização" />
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
            <FilterBar>
                <Field label="Situação">
                    <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                        <option value="ativos">Ativos</option><option value="">Todos</option>
                        {Object.entries(STAFF_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                </Field>
                <Field label="Prioridade">
                    <Select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
                        <option value="">Todas</option>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                </Field>
                <Checkbox checked={filters.mine === '1'} onChange={(e) => setFilters((f) => ({ ...f, mine: e.target.checked ? '1' : '' }))}>Só os meus</Checkbox>
            </FilterBar>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && (
                <Table columns={['Chamado', 'Escritório', 'Prioridade', 'Situação', 'Responsável', 'Atualizado']}
                    empty={data.resultados.length === 0 && <Empty>Nenhum chamado.</Empty>}>
                    {data.resultados.map((t) => (
                        <tr key={t.id} className={styles.clickable} tabIndex={0}
                            onClick={() => setCurrent(t.id)} onKeyDown={(e) => e.key === 'Enter' && setCurrent(t.id)}>
                            <td><strong>#{t.id} · {t.subject}</strong><div className={styles.muted}>{t.category_label}{!t.first_response_at ? ' · sem resposta' : ''}</div></td>
                            <td data-label="Escritório">{t.organization}<div className={styles.muted}>{t.opened_by}</div></td>
                            <td data-label="Prioridade"><StatusPill map={PRIORITY} value={t.priority} /></td>
                            <td data-label="Situação"><StatusPill map={STAFF_STATUS} value={t.status} /></td>
                            <td data-label="Responsável">{t.assigned_to || '—'}</td>
                            <td data-label="Atualizado">{fmtDateTime(t.updated_at)}</td>
                        </tr>
                    ))}
                </Table>
            )}
        </div>
    );
}
