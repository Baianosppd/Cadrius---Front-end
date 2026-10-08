import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import TabBar from '../../components/ui/TabBar';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, StatCard, fmtDateTime, errorMessage } from '../../components/seguranca/ui';


function Politica({ canEdit }) {
    const [policy, setPolicy] = useState(null);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get('ai/policy/').then((r) => { setPolicy(r.data); setForm(r.data); }).catch((e) => setError(errorMessage(e)));
    }, []);

    if (error) return <Banner tone="error">{error}</Banner>;
    if (!form) return <Empty>Carregando…</Empty>;

    const toggleProvider = (p) => setForm((f) => ({
        ...f, allowed_providers: f.allowed_providers.includes(p) ? f.allowed_providers.filter((x) => x !== p) : [...f.allowed_providers, p],
    }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await api.patch('ai/policy/', {
                ai_enabled: form.ai_enabled, autonomy_level: form.autonomy_level, allowed_providers: form.allowed_providers,
                daily_ai_request_limit: Number(form.daily_ai_request_limit), max_actions_per_ai_workflow: Number(form.max_actions_per_ai_workflow),
            });
            setPolicy(data); setForm(data);
            toast.success('Política de IA atualizada.');
        } catch (err) { toast.error(errorMessage(err)); } finally { setSaving(false); }
    };

    const selected = policy.autonomy_choices.find((c) => c.value === form.autonomy_level);
    return (
        <form className={styles.page} onSubmit={save}>
            {!canEdit && <Banner tone="info">Somente donos e administradores podem alterar a política. Você está vendo as regras em vigor.</Banner>}
            {!form.ai_enabled && <Banner tone="warn">A IA está <strong>desligada</strong> para este escritório (kill switch). Nenhuma chamada de IA será feita.</Banner>}
            <div className={styles.two_col}>
                <div className={styles.card}>
                    <div className={styles.section_title}>Controle geral</div>
                    <label className={styles.check_row}>
                        <input type="checkbox" disabled={!canEdit} checked={form.ai_enabled} onChange={(e) => setForm({ ...form, ai_enabled: e.target.checked })} />
                        IA ligada neste escritório
                    </label>
                    <div className={styles.field} style={{ marginTop: 12 }}>
                        Nível de autonomia
                        <select className={styles.select} disabled={!canEdit} value={form.autonomy_level} onChange={(e) => setForm({ ...form, autonomy_level: e.target.value })}>
                            {policy.autonomy_choices.map((c) => <option key={c.value} value={c.value}>{c.label.split(' — ')[0]}</option>)}
                        </select>
                        {selected && <span>{selected.label.split(' — ')[1]}</span>}
                    </div>
                    <p className={styles.card_note} style={{ marginTop: 10 }}>
                        {policy.requires_execution_review ? 'Ações de origem IA aguardam sua confirmação antes de executar.' : 'Ações de workflows aprovados executam automaticamente.'}
                    </p>
                </div>
                <div className={styles.card}>
                    <div className={styles.section_title}>Limites e provedores</div>
                    <div className={styles.field}>Provedores permitidos
                        <div className={styles.stack}>
                            {(policy.providers || []).map((p) => (
                                <label key={p.chave} className={styles.check_row} style={{ alignItems: 'flex-start' }}>
                                    <input type="checkbox" disabled={!canEdit} checked={form.allowed_providers.includes(p.chave)} onChange={() => toggleProvider(p.chave)} />
                                    <span>
                                        <strong>{p.nome}</strong>{' '}
                                        {p.configurado ? <Pill tone="green">Disponível</Pill> : <Pill tone="gray">Não configurado</Pill>}{' '}
                                        {p.treina_com_dados && <Pill tone="yellow">Só sem dados de clientes</Pill>}{' '}
                                        {p.local && <Pill tone="blue">Roda no servidor</Pill>}
                                        <br /><span className={styles.muted}>{p.gratuito ? `Gratuito: ${p.gratuito}. ` : ''}Região: {p.regiao}.</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                        <span className={styles.muted}>Planos gratuitos que usam os dados para treinar a IA nunca recebem dados de clientes —
                            o Cadrius usa esses provedores só em conteúdo genérico.</span>
                    </div>
                    <div className={styles.field} style={{ marginTop: 12 }}>Limite diário de chamadas de IA
                        <input className={styles.input} type="number" min={0} max={10000} disabled={!canEdit} value={form.daily_ai_request_limit} onChange={(e) => setForm({ ...form, daily_ai_request_limit: e.target.value })} />
                    </div>
                    <div className={styles.field} style={{ marginTop: 12 }}>Máximo de ações por workflow gerado por IA
                        <input className={styles.input} type="number" min={1} disabled={!canEdit} value={form.max_actions_per_ai_workflow} onChange={(e) => setForm({ ...form, max_actions_per_ai_workflow: e.target.value })} />
                    </div>
                </div>
            </div>
            {canEdit && <div><button className={`${styles.btn} ${styles.btn_primary}`} disabled={saving}>{saving ? 'Salvando…' : 'Salvar política'}</button></div>}
        </form>
    );
}

function Confirmacoes() {
    const [items, setItems] = useState(null);
    const [error, setError] = useState(null);
    const load = useCallback(() => api.get('ai/executions/pending/').then((r) => { setItems(r.data); setError(null); }).catch((e) => setError(errorMessage(e))), []);
    useEffect(() => { load(); }, [load]);

    const review = async (id, decision) => {
        try {
            await api.post(`ai/executions/${id}/review/`, { decision });
            toast.success(decision === 'approve' ? 'Execução aprovada.' : 'Execução rejeitada.');
            load();
        } catch (err) { toast.error(errorMessage(err)); }
    };

    if (error) return <Banner tone="error">{error}</Banner>;
    if (!items) return <Empty>Carregando…</Empty>;
    return (
        <div className={styles.page}>
            <Banner tone="info">Ações disparadas por automações criadas pela IA só são executadas depois da sua confirmação (humano no circuito).</Banner>
            {items.length === 0 ? <Empty>Nenhuma execução aguardando confirmação.</Empty> : (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Automação</th><th>Recebida em</th><th>O que será feito</th><th>Campos do evento</th><th /></tr></thead>
                        <tbody>
                            {items.map((x) => (
                                <tr key={x.id}>
                                    <td>{x.workflow_name}</td><td>{fmtDateTime(x.created_at)}</td>
                                    <td>{x.action_summary.map((a, i) => <div key={i}><Pill tone="blue">{a.type}</Pill> {a.target}</div>)}</td>
                                    <td className={styles.muted}>{x.payload_fields.join(', ') || '—'}</td>
                                    <td><div className={styles.btn_row}>
                                        <button className={`${styles.btn} ${styles.btn_primary}`} onClick={() => review(x.id, 'approve')}>Aprovar</button>
                                        <button className={styles.btn} onClick={() => review(x.id, 'reject')}>Rejeitar</button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function Atividade() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => { api.get('ai/activity/').then((r) => setData(r.data)).catch((e) => setError(errorMessage(e))); }, []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    const s = data.summary;
    return (
        <div className={styles.page}>
            <div className={styles.grid}>
                <StatCard title="Chamadas (7 dias)" value={s.requests_7d} />
                <StatCard title="Bloqueadas (7 dias)" value={s.blocked_7d} tone={s.blocked_7d > 0 ? 'yellow' : undefined} />
                <StatCard title="Com falha (7 dias)" value={s.failed_7d} tone={s.failed_7d > 0 ? 'red' : undefined} />
            </div>
            <p className={styles.muted}>Mostramos apenas metadados (tipo, provedor, tamanho, duração) — o conteúdo enviado à IA nunca é gravado.</p>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Quando</th><th>Tipo</th><th>Provedor</th><th>Dados</th><th>Tamanho</th><th>Duração</th><th>Resultado</th></tr></thead>
                    <tbody>
                        {data.recent.map((l) => (
                            <tr key={l.id}>
                                <td>{fmtDateTime(l.created_at)}</td><td>{l.kind}</td><td>{l.provider}</td>
                                <td className={styles.muted}>{(l.data_categories || []).join(', ') || '—'}</td>
                                <td>{l.input_chars} car.</td><td>{l.duration_ms} ms</td>
                                <td>{l.blocked ? <Pill tone="orange">Bloqueada: {l.block_reason}</Pill> : l.success ? <Pill tone="green">OK</Pill> : <Pill tone="red">Falha</Pill>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.recent.length === 0 && <Empty>Nenhum uso de IA registrado.</Empty>}
            </div>
        </div>
    );
}

export default function IASegura() {
    const { isOrgManager } = useAuth();
    const [tab, setTab] = useState('politica');
    const tabs = [{ id: 'politica', label: 'Política' }, ...(isOrgManager ? [{ id: 'fila', label: 'Confirmações' }, { id: 'uso', label: 'Uso' }] : [])];
    return (
        <div className={styles.page}>
            <PageHeader title="IA segura" subtitle="Limites, aprovações e histórico da IA" />
            <TabBar tabs={tabs} activeTab={tab} onTabChange={setTab} />
            {tab === 'politica' && <Politica canEdit={isOrgManager} />}
            {tab === 'fila' && <Confirmacoes />}
            {tab === 'uso' && <Atividade />}
        </div>
    );
}
