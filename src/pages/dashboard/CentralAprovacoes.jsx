import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import TabBar from '../../components/ui/TabBar';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, Pill, errorMessage } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import PerfilEscritorio from '../../components/ia/PerfilEscritorio';
import Aprendizado from '../../components/ia/Aprendizado';
import { MEMORY_KIND, MODE_LABEL, RISK_LABEL, RULE_KIND, brainApi, pct, promotionProgress, ruleEvidence } from '../../services/brain';

const card = { background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: 16, marginBottom: 12 };

function useLoad(fn) {
    const [state, setState] = useState({ data: null, error: null });
    const load = useCallback(() => fn().then((data) => setState({ data, error: null })).catch((e) => setState({ data: null, error: errorMessage(e) })), [fn]);
    useEffect(() => { load(); }, [load]);
    return [state, load];
}

function Aprovacoes() {
    const { isOrgManager, role } = useAuth();
    const [{ data, error }, reload] = useLoad(brainApi.approvals);
    const decideRule = async (id, decision) => {
        try { await brainApi.decideRule(id, decision); toast.success('Decisão registrada.'); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    const decideProposal = async (id, decision) => {
        try { await brainApi.decideProposal(id, decision); toast.success('Decisão registrada.'); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    const nothing = !data.document_reviews.length && !data.rules_proposed.length && !data.autonomy_proposals.length && !data.automation_executions_pending;
    return (
        <div className={styles.page}>
            <Banner tone="info">Aqui ficam as decisões que a IA preparou e dependem de você. Nada importante acontece sem a sua aprovação.</Banner>
            {nothing && <Empty>Nada aguardando decisão.</Empty>}

            {data.document_reviews.length > 0 && (
                <section>
                    <h3>Leituras de documentos para revisar ({data.document_reviews.length})</h3>
                    {data.document_reviews.map((d) => (
                        <div key={d.document_id} style={{ ...card, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                            <div>
                                <strong>{d.nome}</strong>
                                <div style={{ color: 'var(--c-muted)', fontSize: '0.85rem' }}>
                                    {d.provider === 'LOCAL' ? 'Leitura básica local (sem IA)' : `IA ${d.provider}`}{d.confidence != null && ` · confiança ${d.confidence}%`}{d.prazos ? ` · ${d.prazos} prazo(s)` : ''}
                                </div>
                            </div>
                            <Link to={`/documents/${d.document_id}`}>Revisar</Link>
                        </div>
                    ))}
                </section>
            )}

            {data.automation_executions_pending > 0 && (
                <div style={card}>
                    <strong>{data.automation_executions_pending}</strong> execução(ões) de automação criadas pela IA aguardam sua aprovação. <Link to="/ia">Abrir IA Segura</Link>
                </div>
            )}

            {isOrgManager && data.rules_proposed.length > 0 && (
                <section>
                    <h3>Regras sugeridas pelo sistema</h3>
                    {data.rules_proposed.map((r) => (
                        <div key={r.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 260px' }}>
                                <Pill tone="blue">{RULE_KIND[r.kind] || r.kind}</Pill> {r.description}
                                <div className={styles.muted}>{ruleEvidence(r)}</div>
                            </div>
                            <div className={styles.btn_row}>
                                <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => decideRule(r.id, 'approve')}>Aprovar regra</button>
                                <button type="button" className={styles.btn} onClick={() => decideRule(r.id, 'reject')}>Recusar</button>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {role === 'OWNER' && data.autonomy_proposals.length > 0 && (
                <section>
                    <h3>A IA merece mais autonomia?</h3>
                    {data.autonomy_proposals.map((p) => (
                        <div key={p.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                            <div>
                                <strong>{p.label}</strong>: de “{MODE_LABEL[p.from_mode]}” para “{MODE_LABEL[p.to_mode]}”
                                <div style={{ color: 'var(--c-muted)', fontSize: '0.85rem' }}>{p.samples} decisões nos últimos 60 dias, {pct(p.approval_rate)} aprovadas sem edição, nenhuma rejeitada ou desfeita.</div>
                            </div>
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <button onClick={() => decideProposal(p.id, 'approve')}>Liberar</button>{' '}
                                <button onClick={() => decideProposal(p.id, 'reject')}>Manter como está</button>
                            </span>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
}

function Autonomia() {
    const { role } = useAuth();
    const [{ data, error }, reload] = useLoad(brainApi.autonomy);
    const set = async (kind, mode) => {
        try { await brainApi.setAutonomy(kind, mode); toast.success('Autonomia atualizada.'); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    return (
        <div className={styles.page}>
            <Banner tone="info">Defina o quanto a IA pode fazer sozinha em cada tipo de ação. Ações de alto impacto (R4) <strong>sempre</strong> dependem do advogado e não podem ser automatizadas.
                {role !== 'OWNER' && ' Apenas o dono do escritório altera estes níveis.'}</Banner>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Ação</th><th>Risco</th><th>Nível</th><th>Últimos 60 dias</th><th>Rumo à autonomia</th></tr></thead>
                    <tbody>
                        {data.levels.map((r) => {
                            const prog = promotionProgress(r, data.criteria);
                            return (
                                <tr key={r.action_kind}>
                                    <td>{r.label}</td>
                                    <td><Pill tone={r.locked ? 'red' : 'gray'}>{RISK_LABEL[r.risk]}</Pill></td>
                                    <td>
                                        <select value={r.mode} disabled={role !== 'OWNER' || r.allowed_modes.length < 2} onChange={(e) => set(r.action_kind, e.target.value)}>
                                            {r.allowed_modes.map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
                                        </select>
                                    </td>
                                    <td>{r.samples ? `${r.samples} decisões · ${pct(r.approval_rate)} sem edição${r.rejected ? ` · ${r.rejected} rejeitadas` : ''}${r.undone ? ` · ${r.undone} desfeitas` : ''}` : '—'}</td>
                                    <td>{prog ? (prog.ready ? <Pill tone="green">Pronta para promoção</Pill> : prog.blocked ? <Pill tone="orange">Há rejeições/desfazimentos</Pill> : `${Math.round(prog.volume * 100)}% do volume · ${Math.round(prog.quality * 100)}% da qualidade`) : '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p style={{ color: 'var(--c-muted)', fontSize: '0.85rem' }}>
                Critério para sugerir mais autonomia: {data.criteria.min_samples} decisões em {data.criteria.window_days} dias com {pct(data.criteria.min_approval_rate)} aprovadas sem edição e nenhuma rejeitada ou desfeita.
                Um erro grave rebaixa o nível imediatamente.
            </p>
        </div>
    );
}

function Regras() {
    const { isOrgManager } = useAuth();
    const [{ data, error }, reload] = useLoad(brainApi.rules);
    const decide = async (id, decision) => {
        try { await brainApi.decideRule(id, decision); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    const LABEL = { proposed: ['Proposta', 'yellow'], active: ['Ativa', 'green'], disabled: ['Desligada', 'gray'] };
    return (
        <div className={styles.page}>
            <Banner tone="info">
                Regras aprendidas com o trabalho da equipe: correções repetidas na leitura de documentos e trocas de termos que vocês
                sempre fazem nas minutas e posts (vocabulário do escritório). Só valem depois de aprovadas e podem ser desligadas quando quiser.
            </Banner>
            {data.length === 0 && <Empty>Ainda não há regras. Elas aparecem quando a mesma correção ou troca de termo se repete.</Empty>}
            {data.map((r) => (
                <div key={r.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 260px' }}>
                        <Pill tone="blue">{RULE_KIND[r.kind] || r.kind}</Pill> <Pill tone={LABEL[r.status]?.[1]}>{LABEL[r.status]?.[0] || r.status}</Pill>
                        <div>{r.description}</div>
                        <div className={styles.muted}>{ruleEvidence(r)}</div>
                    </div>
                    {isOrgManager && (
                        <div className={styles.btn_row}>
                            {r.status !== 'active' && <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => decide(r.id, 'approve')}>Ativar</button>}
                            {r.status === 'active' && <button type="button" className={styles.btn} onClick={() => decide(r.id, 'disable')}>Desligar</button>}
                            {r.status === 'proposed' && <button type="button" className={styles.btn} onClick={() => decide(r.id, 'reject')}>Recusar</button>}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function Memoria() {
    const { isOrgManager } = useAuth();
    const [{ data, error }, reload] = useLoad(brainApi.memory);
    const [form, setForm] = useState({ kind: 'template', title: '', text: '' });
    const [query, setQuery] = useState('');
    const [found, setFound] = useState(null);
    const add = async (e) => {
        e.preventDefault();
        try { await brainApi.addMemory(form); setForm({ kind: 'template', title: '', text: '' }); toast.success('Adicionado à memória do escritório.'); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    const remove = async (id) => {
        if (!window.confirm('Apagar este item da memória?')) return;
        try { await brainApi.deleteMemory(id); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    const search = async (e) => { e.preventDefault(); try { setFound(await brainApi.searchMemory(query)); } catch (err) { toast.error(errorMessage(err)); } };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    return (
        <div className={styles.page}>
            <Banner tone="info">A memória é só do seu escritório (cifrada e isolada). Modelos de peça e leituras aprovadas ajudam a IA a seguir o seu estilo — sem treinar modelos de terceiros.</Banner>
            <form onSubmit={search} style={{ display: 'flex', gap: 8 }}>
                <input style={{ flex: 1, padding: 8, border: '1px solid var(--c-border-2)', borderRadius: 6 }} placeholder="Buscar na memória (ex.: contestação horas extras)" value={query} onChange={(e) => setQuery(e.target.value)} />
                <button type="submit">Buscar</button>
            </form>
            {found && (found.length === 0 ? <Empty>Nada parecido encontrado.</Empty> : found.map((f) => (
                <div key={f.id} style={card}><strong>{f.title || MEMORY_KIND[f.kind]}</strong> <small>({Math.round(f.score * 100)}% parecido)</small><div style={{ color: 'var(--c-text-2)' }}>{f.preview}</div></div>
            )))}
            {isOrgManager && (
                <form onSubmit={add} style={{ ...card, display: 'grid', gap: 8 }}>
                    <strong>Adicionar à memória</strong>
                    <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                        <option value="template">Modelo de peça</option><option value="note">Anotação</option><option value="decision">Decisão/entendimento</option>
                    </select>
                    <input placeholder="Título" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    <textarea placeholder="Texto (sem dados pessoais de clientes, se possível)" required rows={5} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
                    <div><button type="submit">Adicionar</button></div>
                </form>
            )}
            <h3>Itens da memória ({data.length})</h3>
            {data.length === 0 && <Empty>A memória está vazia. Ela cresce quando você confirma leituras de documentos.</Empty>}
            {data.map((m) => (
                <div key={m.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div><Pill tone="blue">{MEMORY_KIND[m.kind] || m.kind}</Pill> <strong>{m.title}</strong><div style={{ color: 'var(--c-muted)', fontSize: '0.85rem' }}>{m.preview}</div></div>
                    {isOrgManager && <button onClick={() => remove(m.id)} style={{ color: 'var(--c-danger)' }}>Apagar</button>}
                </div>
            ))}
        </div>
    );
}

const TABS = [{ id: 'aprovacoes', label: 'Aprovações' }, { id: 'aprendizado', label: 'Aprendizado' }, { id: 'perfil', label: 'Perfil do escritório' },
    { id: 'autonomia', label: 'Autonomia da IA' }, { id: 'regras', label: 'Regras do escritório' }, { id: 'memoria', label: 'Memória' }];

export default function CentralAprovacoes() {
    const [tab, setTab] = useState('aprovacoes');
    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.page_title}>IA do escritório</h1>
                <div className={styles.page_subtitle}>O que a IA preparou para você decidir, o quanto ela pode fazer sozinha e o que ela já aprendeu</div>
            </div>
            <TabBar tabs={TABS} activeTab={tab} onTabChange={setTab} />
            {tab === 'aprovacoes' && <Aprovacoes />}
            {tab === 'aprendizado' && <Aprendizado />}
            {tab === 'perfil' && <PerfilEscritorio />}
            {tab === 'autonomia' && <Autonomia />}
            {tab === 'regras' && <Regras />}
            {tab === 'memoria' && <Memoria />}
        </div>
    );
}
