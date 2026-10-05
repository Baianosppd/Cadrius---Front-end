import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, Pill, errorMessage, fmtDateTime } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
import { STEP_STATUS, describeRule, hasExternal, rulesApi } from '../../services/rules';
import RuleEditor from './RuleEditor';
import SugestoesIA from '../ia/SugestoesIA';

function Simulacao({ result, onClose, onEnable }) {
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.modal} style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
                <div className={styles.modal_title}>Simulação: {result.regra.nome}</div>
                <Banner tone="info">
                    {result.origem === 'real'
                        ? <>Usando o evento real mais recente: <strong>{result.evento}</strong>. Nada foi enviado nem criado.</>
                        : <>O escritório ainda não tem um evento deste tipo: usamos um <strong>exemplo fictício</strong>. Nada foi enviado nem criado.</>}
                </Banner>
                {result.condicoes.length > 0 && (
                    <>
                        <div className={styles.section_title}>Condições</div>
                        {result.condicoes.map((c, i) => (
                            <div key={i}><Pill tone={c.atendida ? 'green' : 'gray'}>{c.atendida ? 'atende' : 'não atende'}</Pill> {c.field} {c.op} {Array.isArray(c.value) ? c.value.join(', ') : c.value}</div>
                        ))}
                    </>
                )}
                <div className={styles.section_title}>O que faria</div>
                {!result.condicoes_atendidas && <Empty>Com este evento as condições não são atendidas: nada seria feito.</Empty>}
                {result.passos.map((p, i) => {
                    const [label, tone] = STEP_STATUS[p.status] || [p.status, 'gray'];
                    return (
                        <div key={i} className={styles.card} style={{ marginBottom: 8 }}>
                            <div><strong>{i + 1}. {p.rotulo}</strong> <Pill tone={tone}>{label}</Pill></div>
                            <div className={styles.muted}>{p.detalhe}</div>
                            {p.dados?.assunto && <div><strong>Assunto:</strong> {p.dados.assunto}</div>}
                            {p.dados?.mensagem && <div className={styles.doc_text} style={{ whiteSpace: 'pre-wrap' }}>{p.dados.mensagem}</div>}
                        </div>
                    );
                })}
                <div className={styles.btn_row}>
                    {!result.regra.ativa && <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={onEnable}>Ligar a regra</button>}
                    <button type="button" className={styles.btn} onClick={onClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
}

export default function RegrasTab({ canManage }) {
    const { data, error, reload } = useLoader(() => Promise.all([rulesApi.list(), rulesApi.catalog(), rulesApi.templates()]), []);
    const [editing, setEditing] = useState(null);
    const [sim, setSim] = useState(null);
    const [showTemplates, setShowTemplates] = useState(false);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
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
        <div className={styles.stack}>
            <SugestoesIA canManage={canManage} onAccepted={() => reload()} />
            <Banner tone="info">
                Regras do escritório reagem a eventos do Cadrius (documento confirmado, andamento novo, prazo chegando, contato novo, agenda).
                Toda regra nasce desligada, só liga depois de simulada, e mensagens para clientes esperam aprovação.
            </Banner>
            {canManage && (
                <div className={styles.btn_row} style={{ margin: '12px 0' }}>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setShowTemplates((v) => !v)}>Usar um modelo pronto</button>
                    <button type="button" className={styles.btn} onClick={() => setEditing({})}>Criar do zero</button>
                </div>
            )}
            {showTemplates && (
                <div className={styles.grid} style={{ marginBottom: 12 }}>
                    {templates.map((t) => (
                        <div key={t.key} className={styles.card}>
                            <div className={styles.card_title}>{t.name}</div>
                            <p className={styles.muted}>{t.description}</p>
                            <button type="button" className={styles.btn} onClick={() => fromTemplate(t.key)}>Usar este modelo</button>
                        </div>
                    ))}
                </div>
            )}
            {rules.length === 0 && <Empty title="Nenhuma regra ainda">Comece por um modelo pronto: toda regra nasce desligada e só liga depois de simulada.</Empty>}
            {rules.length > 0 && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Regra</th><th>Situação</th><th>Execuções</th><th></th></tr></thead>
                        <tbody>
                            {rules.map((r) => (
                                <tr key={r.id}>
                                    <td>
                                        <strong>{r.nome}</strong>
                                        <div className={styles.muted}>{describeRule(r, catalog)}</div>
                                        {hasExternal(r) && <Pill tone={r.exige_aprovacao ? 'blue' : 'orange'}>{r.exige_aprovacao ? 'envio com aprovação' : 'envio automático'}</Pill>}
                                    </td>
                                    <td>
                                        <Pill tone={r.ativa ? 'green' : 'gray'}>{r.ativa ? 'Ligada' : 'Desligada'}</Pill>
                                        {!r.simulada && <div className={styles.muted}>precisa simular</div>}
                                        {r.pendentes > 0 && <div><Pill tone="yellow">{r.pendentes} aguardando aprovação</Pill></div>}
                                    </td>
                                    <td>{r.execucoes}<div className={styles.muted}>{r.ultima_execucao ? fmtDateTime(r.ultima_execucao) : 'nunca'}</div></td>
                                    <td>
                                        {canManage && (
                                            <div className={styles.btn_row}>
                                                <button type="button" className={styles.btn} onClick={() => simulate(r)}>Simular</button>
                                                <button type="button" className={styles.btn} onClick={() => toggle(r)}>{r.ativa ? 'Desligar' : 'Ligar'}</button>
                                                <button type="button" className={styles.btn} onClick={() => setEditing(r)}>Editar</button>
                                                <button type="button" className={`${styles.btn} ${styles.btn_danger}`}
                                                    onClick={() => window.confirm(`Excluir a regra "${r.nome}"?`) && act(() => rulesApi.remove(r.id), 'Regra excluída.')}>Excluir</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {editing && <RuleEditor catalog={catalog} rule={editing.id ? editing : null} onCancel={() => setEditing(null)}
                onDone={() => { setEditing(null); reload(); }} />}
            {sim && <Simulacao result={sim} onClose={() => setSim(null)}
                onEnable={async () => { await act(() => rulesApi.enable(sim.regra.id, true), 'Regra ligada.'); setSim(null); }} />}
        </div>
    );
}
