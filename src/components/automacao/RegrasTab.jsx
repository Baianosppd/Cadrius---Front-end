import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import { Banner, Button, Empty, Loading, Modal, Pill, Row, Stack, Table } from '../ui';
import { errorMessage, fmtDateTime } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
import { STEP_STATUS, describeRule, hasExternal, rulesApi } from '../../services/rules';
import RuleEditor from './RuleEditor';
import RuleFlowView from './RuleFlowView';
import SugestoesIA from '../ia/SugestoesIA';
import FaleSobreProcesso from '../ia/FaleSobreProcesso';
import FaleSobreProcessoCta from '../ia/FaleSobreProcessoCta';

function Simulacao({ result, onClose, onEnable }) {
    return (
        <Modal title={`Simulação: ${result.regra.nome}`} size="lg" onClose={onClose}
            footer={<>
                {!result.regra.ativa && <Button variant="primary" onClick={onEnable}>Ligar a regra</Button>}
                <Button onClick={onClose}>Fechar</Button>
            </>}>
            <Banner tone="info">
                {result.origem === 'real'
                    ? <>Usando o evento real mais recente: <strong>{result.evento}</strong>. Nada foi enviado nem criado.</>
                    : <>O escritório ainda não tem um evento deste tipo: usamos um <strong>exemplo fictício</strong>. Nada foi enviado nem criado.</>}
            </Banner>
            {result.condicoes.length > 0 && (
                <Stack gap={2}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Condições</div>
                    {result.condicoes.map((c, i) => (
                        <div key={i}><Pill tone={c.atendida ? 'green' : 'gray'}>{c.atendida ? 'atende' : 'não atende'}</Pill> {c.field} {c.op} {Array.isArray(c.value) ? c.value.join(', ') : c.value}</div>
                    ))}
                </Stack>
            )}
            <div className={`${styles.section_title} ${styles.mb_0}`}>O que faria</div>
            {!result.condicoes_atendidas && <Empty>Com este evento as condições não são atendidas: nada seria feito.</Empty>}
            <Stack gap={2}>
                {result.passos.map((p, i) => {
                    const [label, tone] = STEP_STATUS[p.status] || [p.status, 'gray'];
                    return (
                        <div key={i} className={styles.card}>
                            <div><strong>{i + 1}. {p.rotulo}</strong> <Pill tone={tone}>{label}</Pill></div>
                            <div className={styles.muted}>{p.detalhe}</div>
                            {p.dados?.assunto && <div><strong>Assunto:</strong> {p.dados.assunto}</div>}
                            {p.dados?.mensagem && <div className={`${styles.doc_text} ${styles.pre_wrap}`}>{p.dados.mensagem}</div>}
                        </div>
                    );
                })}
            </Stack>
        </Modal>
    );
}

export default function RegrasTab({ canManage }) {
    const { data, error, reload } = useLoader(() => Promise.all([rulesApi.list(), rulesApi.catalog(), rulesApi.templates()]), []);
    const [editing, setEditing] = useState(null);
    const [sim, setSim] = useState(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const [fale, setFale] = useState(false);
    const [params, setParams] = useSearchParams();
    const openId = params.get('regra');
    const openRule = (id) => {
        const next = new URLSearchParams(params);
        if (id) next.set('regra', id); else next.delete('regra');
        setParams(next);
        if (id) window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const [rules, catalog, templates] = data;

    const act = async (fn, ok) => {
        try { const r = await fn(); if (ok) toast.success(ok); reload(); return r; } catch (err) { toast.error(errorMessage(err)); return null; }
    };
    const simulate = async (rule) => {
        const r = await act(() => rulesApi.simulate(rule.id));
        if (r) setSim(r);
    };
    const toggle = async (rule) => {
        try {
            await rulesApi.enable(rule.id, !rule.ativa);
            toast.success(rule.ativa ? 'Regra desligada.' : 'Regra ligada.');
            reload();
        } catch (err) {
            if (err?.response?.data?.code === 'needs_simulation') {
                toast.info('Antes de ligar, veja a simulação.');
                simulate(rule);
            } else toast.error(errorMessage(err));
        }
    };
    const fromTemplate = async (key) => {
        const r = await act(() => rulesApi.fromTemplate(key), 'Regra criada (desligada). Revise e simule.');
        if (r) { setShowTemplates(false); setEditing(r); }
    };

    return (
        <Stack>
            {openId && <RuleFlowView key={openId} ruleId={openId} catalog={catalog} canManage={canManage}
                onClose={() => { openRule(null); reload(); }} onEdit={(r) => setEditing(r)} />}
            {canManage && <FaleSobreProcessoCta onOpen={() => setFale(true)} />}
            {fale && <FaleSobreProcesso onClose={() => { setFale(false); reload(); }} />}
            <SugestoesIA canManage={canManage} onAccepted={(id) => { reload(); if (id) openRule(id); }} />
            {canManage && (
                <Row>
                    <Button variant="primary" aria-expanded={showTemplates} onClick={() => setShowTemplates((v) => !v)}>Usar um modelo pronto</Button>
                    <Button onClick={() => setEditing({})}>Criar do zero</Button>
                </Row>
            )}
            {showTemplates && (
                <div className={styles.grid}>
                    {templates.map((t) => (
                        <div key={t.key} className={styles.card}>
                            <div className={styles.card_title}>{t.name}</div>
                            <p className={styles.muted}>{t.description}</p>
                            <Button onClick={() => fromTemplate(t.key)}>Usar este modelo</Button>
                        </div>
                    ))}
                </div>
            )}
            {rules.length === 0 && <Empty title="Nenhuma regra ainda">Comece por um modelo pronto: toda regra nasce desligada e só liga depois de simulada.</Empty>}
            {rules.length > 0 && (
                <Table columns={['Regra', 'Situação', 'Execuções', { label: '', className: styles.td_actions }]}>
                    {rules.map((r) => (
                        <tr key={r.id}>
                            <td>
                                <strong>{r.nome}</strong>
                                <div className={styles.muted}>{describeRule(r, catalog)}</div>
                                {hasExternal(r) && <Pill tone={r.exige_aprovacao ? 'blue' : 'orange'}>{r.exige_aprovacao ? 'envio com aprovação' : 'envio automático'}</Pill>}
                            </td>
                            <td data-label="Situação">
                                <Pill tone={r.ativa ? 'green' : 'gray'}>{r.ativa ? 'Ligada' : 'Desligada'}</Pill>
                                {!r.simulada && <div className={styles.muted}>precisa simular</div>}
                                {r.pendentes > 0 && <div><Pill tone="yellow">{r.pendentes} aguardando aprovação</Pill></div>}
                            </td>
                            <td data-label="Execuções">{r.execucoes}<div className={styles.muted}>{r.ultima_execucao ? fmtDateTime(r.ultima_execucao) : 'nunca'}</div></td>
                            <td className={styles.td_actions}>
                                <Row gap={1}>
                                    <Button size="sm" variant="primary" onClick={() => openRule(r.id)} aria-label={`Abrir o fluxo da regra ${r.nome}`}>Abrir</Button>
                                    {canManage && (<>
                                        <Button size="sm" onClick={() => toggle(r)}>{r.ativa ? 'Desligar' : 'Ligar'}</Button>
                                        <Button size="sm" variant="ghost" onClick={() => simulate(r)}>Simular</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Editar</Button>
                                        <Button size="sm" variant="danger"
                                            onClick={() => window.confirm(`Excluir a regra "${r.nome}"?`) && act(() => rulesApi.remove(r.id), 'Regra excluída.')}>Excluir</Button>
                                    </>)}
                                </Row>
                            </td>
                        </tr>
                    ))}
                </Table>
            )}
            {editing && <RuleEditor catalog={catalog} rule={editing.id ? editing : null} onCancel={() => setEditing(null)}
                onDone={() => { setEditing(null); reload(); }} />}
            {sim && <Simulacao result={sim} onClose={() => setSim(null)}
                onEnable={async () => { await act(() => rulesApi.enable(sim.regra.id, true), 'Regra ligada.'); setSim(null); }} />}
        </Stack>
    );
}
