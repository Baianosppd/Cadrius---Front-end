import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../../components/ui/ui.module.css';
import { Banner, Button, Empty, Field, FilterBar, Input, Loading, PageHeader, Pill, Row, Select, Stack, Table, Tabs, Textarea } from '../../../components/ui';
import { errorMessage } from '../../../utils/format';
import useAuth from '../../../hooks/useAuth';
import useLoader from '../../../hooks/useLoader';
import PerfilEscritorio from '../../../components/ia/PerfilEscritorio';
import Aprendizado from '../../../components/ia/Aprendizado';
import { MEMORY_KIND, MODE_LABEL, RISK_LABEL, RULE_KIND, brainApi, pct, promotionProgress, ruleEvidence } from '../../../services/brain';

// Item de lista em cartão: texto à esquerda, ações à direita (quebra no celular)
function ItemCard({ children, actions }) {
    return (
        <Row justify="between" gap={3} className={styles.card}>
            <div className={styles.flex_1}>{children}</div>
            {actions && <Row>{actions}</Row>}
        </Row>
    );
}

function Aprovacoes() {
    const { isOrgManager, role } = useAuth();
    const { data, error, reload } = useLoader(brainApi.approvals, []);
    const decideRule = async (id, decision) => {
        try { await brainApi.decideRule(id, decision); toast.success('Decisão registrada.'); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    const decideProposal = async (id, decision) => {
        try { await brainApi.decideProposal(id, decision); toast.success('Decisão registrada.'); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const nothing = !data.document_reviews.length && !data.rules_proposed.length && !data.autonomy_proposals.length && !data.automation_executions_pending;
    return (
        <Stack>
            {nothing && <Empty title="Nada esperando você">Quando a IA preparar algo que precisa da sua decisão, aparece aqui.</Empty>}

            {data.document_reviews.length > 0 && (
                <Stack as="section" gap={3}>
                    <h3 className={`${styles.section_title} ${styles.mb_0}`}>Leituras de documentos para revisar ({data.document_reviews.length})</h3>
                    {data.document_reviews.map((d) => (
                        <ItemCard key={d.document_id} actions={<Button as={Link} to={`/documents/${d.document_id}`} size="sm" variant="primary">Revisar</Button>}>
                            <strong>{d.nome}</strong>
                            <div className={styles.muted}>
                                {d.provider === 'LOCAL' ? 'Leitura básica local (sem IA)' : `IA ${d.provider}`}{d.confidence != null && ` · confiança ${d.confidence}%`}{d.prazos ? ` · ${d.prazos} prazo(s)` : ''}
                            </div>
                        </ItemCard>
                    ))}
                </Stack>
            )}

            {data.automation_executions_pending > 0 && (
                <ItemCard actions={<Button as={Link} to="/ia" size="sm">Abrir IA Segura</Button>}>
                    <strong>{data.automation_executions_pending}</strong> execução(ões) de automação criadas pela IA aguardam sua aprovação.
                </ItemCard>
            )}

            {isOrgManager && data.rules_proposed.length > 0 && (
                <Stack as="section" gap={3}>
                    <h3 className={`${styles.section_title} ${styles.mb_0}`}>Regras sugeridas pelo sistema</h3>
                    {data.rules_proposed.map((r) => (
                        <ItemCard key={r.id} actions={<>
                            <Button variant="primary" onClick={() => decideRule(r.id, 'approve')}>Aprovar regra</Button>
                            <Button onClick={() => decideRule(r.id, 'reject')}>Recusar</Button>
                        </>}>
                            <Pill tone="blue">{RULE_KIND[r.kind] || r.kind}</Pill> {r.description}
                            <div className={styles.muted}>{ruleEvidence(r)}</div>
                        </ItemCard>
                    ))}
                </Stack>
            )}

            {role === 'OWNER' && data.autonomy_proposals.length > 0 && (
                <Stack as="section" gap={3}>
                    <h3 className={`${styles.section_title} ${styles.mb_0}`}>A IA merece mais autonomia?</h3>
                    {data.autonomy_proposals.map((p) => (
                        <ItemCard key={p.id} actions={<>
                            <Button variant="primary" onClick={() => decideProposal(p.id, 'approve')}>Liberar</Button>
                            <Button onClick={() => decideProposal(p.id, 'reject')}>Manter como está</Button>
                        </>}>
                            <strong>{p.label}</strong>: de “{MODE_LABEL[p.from_mode]}” para “{MODE_LABEL[p.to_mode]}”
                            <div className={styles.muted}>{p.samples} decisões nos últimos 60 dias, {pct(p.approval_rate)} aprovadas sem edição, nenhuma rejeitada ou desfeita.</div>
                        </ItemCard>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}

function Autonomia() {
    const { role } = useAuth();
    const { data, error, reload } = useLoader(brainApi.autonomy, []);
    const set = async (kind, mode) => {
        try { await brainApi.setAutonomy(kind, mode); toast.success('Autonomia atualizada.'); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <Stack>
            {role !== 'OWNER' && <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Só o dono do escritório altera estes níveis.</p>}
            <Table columns={['Ação', 'Risco', 'Nível', 'Últimos 60 dias', 'Rumo à autonomia']}>
                {data.levels.map((r) => {
                    const prog = promotionProgress(r, data.criteria);
                    return (
                        <tr key={r.action_kind}>
                            <td>{r.label}</td>
                            <td data-label="Risco"><Pill tone={r.locked ? 'red' : 'gray'}>{RISK_LABEL[r.risk]}</Pill></td>
                            <td data-label="Nível">
                                <Select className={styles.w_fit} aria-label={`Nível de autonomia: ${r.label}`} value={r.mode}
                                    disabled={role !== 'OWNER' || r.allowed_modes.length < 2} onChange={(e) => set(r.action_kind, e.target.value)}>
                                    {r.allowed_modes.map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
                                </Select>
                            </td>
                            <td data-label="Últimos 60 dias">{r.samples ? `${r.samples} decisões · ${pct(r.approval_rate)} sem edição${r.rejected ? ` · ${r.rejected} rejeitadas` : ''}${r.undone ? ` · ${r.undone} desfeitas` : ''}` : '—'}</td>
                            <td data-label="Rumo à autonomia">{prog ? (prog.ready ? <Pill tone="green">Pronta para promoção</Pill> : prog.blocked ? <Pill tone="orange">Há rejeições/desfazimentos</Pill> : `${Math.round(prog.volume * 100)}% do volume · ${Math.round(prog.quality * 100)}% da qualidade`) : '—'}</td>
                        </tr>
                    );
                })}
            </Table>
            <p className={`${styles.muted} ${styles.mt_0}`}>
                Critério para sugerir mais autonomia: {data.criteria.min_samples} decisões em {data.criteria.window_days} dias com {pct(data.criteria.min_approval_rate)} aprovadas sem edição e nenhuma rejeitada ou desfeita.
                Um erro grave rebaixa o nível imediatamente.
            </p>
        </Stack>
    );
}

const RULE_STATUS = { proposed: ['Proposta', 'yellow'], active: ['Ativa', 'green'], disabled: ['Desligada', 'gray'] };

function Regras() {
    const { isOrgManager } = useAuth();
    const { data, error, reload } = useLoader(brainApi.rules, []);
    const decide = async (id, decision) => {
        try { await brainApi.decideRule(id, decision); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <Stack gap={3}>
            {data.length === 0 && <Empty>Ainda não há regras. Elas aparecem quando a mesma correção ou troca de termo se repete.</Empty>}
            {data.map((r) => (
                <ItemCard key={r.id} actions={isOrgManager && <>
                    {r.status !== 'active' && <Button variant="primary" onClick={() => decide(r.id, 'approve')}>Ativar</Button>}
                    {r.status === 'active' && <Button onClick={() => decide(r.id, 'disable')}>Desligar</Button>}
                    {r.status === 'proposed' && <Button onClick={() => decide(r.id, 'reject')}>Recusar</Button>}
                </>}>
                    <Pill tone="blue">{RULE_KIND[r.kind] || r.kind}</Pill> <Pill tone={RULE_STATUS[r.status]?.[1]}>{RULE_STATUS[r.status]?.[0] || r.status}</Pill>
                    <div>{r.description}</div>
                    <div className={styles.muted}>{ruleEvidence(r)}</div>
                </ItemCard>
            ))}
        </Stack>
    );
}

const EMPTY_MEMORY = { kind: 'template', title: '', text: '' };

function Memoria() {
    const { isOrgManager } = useAuth();
    const { data, error, reload } = useLoader(brainApi.memory, []);
    const [form, setForm] = useState(EMPTY_MEMORY);
    const [query, setQuery] = useState('');
    const [found, setFound] = useState(null);
    const add = async (e) => {
        e.preventDefault();
        try { await brainApi.addMemory(form); setForm(EMPTY_MEMORY); toast.success('Adicionado à memória do escritório.'); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    const remove = async (id) => {
        if (!window.confirm('Apagar este item da memória?')) return;
        try { await brainApi.deleteMemory(id); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    const search = async (e) => { e.preventDefault(); try { setFound(await brainApi.searchMemory(query)); } catch (err) { toast.error(errorMessage(err)); } };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <Stack>
            <FilterBar as="form" onSubmit={search}>
                <Field label="Buscar na memória" className={styles.flex_2}>
                    <Input placeholder="Ex.: contestação horas extras" value={query} onChange={(e) => setQuery(e.target.value)} />
                </Field>
                <Button type="submit">Buscar</Button>
            </FilterBar>
            {found && (found.length === 0 ? <Empty>Nada parecido encontrado.</Empty> : found.map((f) => (
                <div key={f.id} className={styles.card}>
                    <strong>{f.title || MEMORY_KIND[f.kind]}</strong> <small className={styles.muted}>({Math.round(f.score * 100)}% parecido)</small>
                    <div>{f.preview}</div>
                </div>
            )))}
            {isOrgManager && (
                <Stack as="form" gap={3} className={styles.card} onSubmit={add}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Adicionar à memória</div>
                    <FilterBar>
                        <Field label="Tipo">
                            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                                <option value="template">Modelo de peça</option><option value="note">Anotação</option><option value="decision">Decisão/entendimento</option>
                            </Select>
                        </Field>
                        <Field label="Título" className={styles.flex_2}><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                    </FilterBar>
                    <Field label="Texto" hint="Sem dados pessoais de clientes, se possível.">
                        <Textarea required rows={5} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
                    </Field>
                    <Button type="submit" variant="primary" className={styles.w_fit}>Adicionar</Button>
                </Stack>
            )}
            <h3 className={`${styles.section_title} ${styles.mb_0}`}>Itens da memória ({data.length})</h3>
            {data.length === 0 && <Empty>A memória está vazia. Ela cresce quando você confirma leituras de documentos.</Empty>}
            {data.map((m) => (
                <ItemCard key={m.id} actions={isOrgManager && <Button size="sm" variant="danger" onClick={() => remove(m.id)}>Apagar</Button>}>
                    <Pill tone="blue">{MEMORY_KIND[m.kind] || m.kind}</Pill> <strong>{m.title}</strong>
                    <div className={styles.muted}>{m.preview}</div>
                </ItemCard>
            ))}
        </Stack>
    );
}

const TABS = [{ id: 'aprovacoes', label: 'Aprovações' }, { id: 'aprendizado', label: 'Aprendizado' }, { id: 'perfil', label: 'Perfil do escritório' },
    { id: 'autonomia', label: 'Autonomia da IA' }, { id: 'regras', label: 'Regras do escritório' }, { id: 'memoria', label: 'Memória' }];

export default function CentralAprovacoes() {
    const [tab, setTab] = useState('aprovacoes');
    return (
        <div className={styles.page}>
            <PageHeader title="IA do escritório" subtitle="Decisões, autonomia e aprendizado da IA" />
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
            {tab === 'aprovacoes' && <Aprovacoes />}
            {tab === 'aprendizado' && <Aprendizado />}
            {tab === 'perfil' && <PerfilEscritorio />}
            {tab === 'autonomia' && <Autonomia />}
            {tab === 'regras' && <Regras />}
            {tab === 'memoria' && <Memoria />}
        </div>
    );
}
