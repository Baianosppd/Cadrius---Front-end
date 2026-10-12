import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';
import styles from '../../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Empty, Field, Input, Loading, PageHeader, Pill, Row, Select, Stack, StatCard, Table, Tabs } from '../../../components/ui';
import { errorMessage, fmtDateTime } from '../../../utils/format';

function Politica({ canEdit }) {
    const [policy, setPolicy] = useState(null);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get('ai/policy/').then((r) => { setPolicy(r.data); setForm(r.data); }).catch((e) => setError(errorMessage(e)));
    }, []);

    if (error) return <Banner tone="error">{error}</Banner>;
    if (!form) return <Loading />;

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
        <Stack as="form" onSubmit={save}>
            {!canEdit && <Banner tone="info">Somente donos e administradores podem alterar a política. Você está vendo as regras em vigor.</Banner>}
            {!form.ai_enabled && <Banner tone="warn">A IA está <strong>desligada</strong> para este escritório (kill switch). Nenhuma chamada de IA será feita.</Banner>}
            <div className={`${styles.two_col} ${styles.align_start}`}>
                <Stack gap={3} className={styles.card}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Controle geral</div>
                    <Checkbox disabled={!canEdit} checked={form.ai_enabled} onChange={(e) => setForm({ ...form, ai_enabled: e.target.checked })}>
                        IA ligada neste escritório
                    </Checkbox>
                    <Field label="Nível de autonomia" hint={selected?.label.split(' — ')[1]}>
                        <Select disabled={!canEdit} value={form.autonomy_level} onChange={(e) => setForm({ ...form, autonomy_level: e.target.value })}>
                            {policy.autonomy_choices.map((c) => <option key={c.value} value={c.value}>{c.label.split(' — ')[0]}</option>)}
                        </Select>
                    </Field>
                    <p className={`${styles.card_note} ${styles.mt_0} ${styles.mb_0}`}>
                        {policy.requires_execution_review ? 'Ações de origem IA aguardam sua confirmação antes de executar.' : 'Ações de workflows aprovados executam automaticamente.'}
                    </p>
                </Stack>
                <Stack gap={3} className={styles.card}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Limites e provedores</div>
                    <div className={styles.field}>Provedores permitidos
                        <Stack gap={2}>
                            {(policy.providers || []).map((p) => (
                                <Checkbox key={p.chave} className={styles.align_start} disabled={!canEdit} checked={form.allowed_providers.includes(p.chave)} onChange={() => toggleProvider(p.chave)}>
                                    <span>
                                        <strong>{p.nome}</strong>{' '}
                                        {p.configurado ? <Pill tone="green">Disponível</Pill> : <Pill tone="gray">Não configurado</Pill>}{' '}
                                        {p.treina_com_dados && <Pill tone="yellow">Só sem dados de clientes</Pill>}{' '}
                                        {p.local && <Pill tone="blue">Roda no servidor</Pill>}
                                        <br /><span className={styles.muted}>{p.gratuito ? `Gratuito: ${p.gratuito}. ` : ''}Região: {p.regiao}.</span>
                                    </span>
                                </Checkbox>
                            ))}
                        </Stack>
                        <span className={styles.muted}>Planos gratuitos que usam os dados para treinar a IA nunca recebem dados de clientes —
                            o Cadrius usa esses provedores só em conteúdo genérico.</span>
                    </div>
                    <Field label="Limite diário de chamadas de IA">
                        <Input type="number" min={0} max={10000} disabled={!canEdit} value={form.daily_ai_request_limit} onChange={(e) => setForm({ ...form, daily_ai_request_limit: e.target.value })} />
                    </Field>
                    <Field label="Máximo de ações por workflow gerado por IA">
                        <Input type="number" min={1} disabled={!canEdit} value={form.max_actions_per_ai_workflow} onChange={(e) => setForm({ ...form, max_actions_per_ai_workflow: e.target.value })} />
                    </Field>
                </Stack>
            </div>
            {canEdit && <Button type="submit" variant="primary" className={styles.w_fit} loading={saving} loadingLabel="Salvando…">Salvar política</Button>}
        </Stack>
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
    if (!items) return <Loading />;
    if (items.length === 0) return <Empty>Nenhuma execução aguardando confirmação.</Empty>;
    return (
        <Table columns={['Automação', 'Recebida em', 'O que será feito', 'Campos do evento', { label: '', className: styles.td_actions }]}>
            {items.map((x) => (
                <tr key={x.id}>
                    <td><strong>{x.workflow_name}</strong></td><td data-label="Recebida em">{fmtDateTime(x.created_at)}</td>
                    <td data-label="O que será feito">{x.action_summary.map((a, i) => <div key={i}><Pill tone="blue">{a.type}</Pill> {a.target}</div>)}</td>
                    <td data-label="Campos" className={styles.muted}>{x.payload_fields.join(', ') || '—'}</td>
                    <td className={styles.td_actions}>
                        <Row gap={1} wrap={false}>
                            <Button size="sm" variant="primary" onClick={() => review(x.id, 'approve')}>Aprovar</Button>
                            <Button size="sm" onClick={() => review(x.id, 'reject')}>Rejeitar</Button>
                        </Row>
                    </td>
                </tr>
            ))}
        </Table>
    );
}

function Atividade() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => { api.get('ai/activity/').then((r) => setData(r.data)).catch((e) => setError(errorMessage(e))); }, []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const s = data.summary;
    return (
        <Stack>
            <div className={styles.grid}>
                <StatCard title="Chamadas (7 dias)" value={s.requests_7d} />
                <StatCard title="Bloqueadas (7 dias)" value={s.blocked_7d} tone={s.blocked_7d > 0 ? 'yellow' : undefined} />
                <StatCard title="Com falha (7 dias)" value={s.failed_7d} tone={s.failed_7d > 0 ? 'red' : undefined} />
            </div>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Mostramos apenas metadados (tipo, provedor, tamanho, duração) — o conteúdo enviado à IA nunca é gravado.</p>
            <Table columns={['Quando', 'Tipo', 'Provedor', 'Dados', 'Tamanho', 'Duração', 'Resultado']}
                empty={data.recent.length === 0 && <Empty>Nenhum uso de IA registrado.</Empty>}>
                {data.recent.map((l) => (
                    <tr key={l.id}>
                        <td>{fmtDateTime(l.created_at)}</td><td data-label="Tipo">{l.kind}</td><td data-label="Provedor">{l.provider}</td>
                        <td data-label="Dados" className={styles.muted}>{(l.data_categories || []).join(', ') || '—'}</td>
                        <td data-label="Tamanho">{l.input_chars} car.</td><td data-label="Duração">{l.duration_ms} ms</td>
                        <td data-label="Resultado">{l.blocked ? <Pill tone="orange">Bloqueada: {l.block_reason}</Pill> : l.success ? <Pill tone="green">OK</Pill> : <Pill tone="red">Falha</Pill>}</td>
                    </tr>
                ))}
            </Table>
        </Stack>
    );
}

export default function IASegura() {
    const { isOrgManager } = useAuth();
    const [tab, setTab] = useState('politica');
    const tabs = [{ id: 'politica', label: 'Política' }, ...(isOrgManager ? [{ id: 'fila', label: 'Confirmações' }, { id: 'uso', label: 'Uso' }] : [])];
    return (
        <div className={styles.page}>
            <PageHeader title="IA segura" subtitle="Limites, aprovações e histórico da IA" />
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
            {tab === 'politica' && <Politica canEdit={isOrgManager} />}
            {tab === 'fila' && <Confirmacoes />}
            {tab === 'uso' && <Atividade />}
        </div>
    );
}
