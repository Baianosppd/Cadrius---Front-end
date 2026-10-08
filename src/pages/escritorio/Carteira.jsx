import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, errorMessage, fmtDate, Loading, PageHeader, Pill, StatCard } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import useLoader from '../gestao/useLoader';
import { AgreementForm, OpportunityForm } from '../../components/carteira/Forms';
import ClientFile from '../../components/carteira/ClientFile';
import {
    AGREEMENT_STATUS, OPEN_STAGES, REC_STATUS, STAGES, brl, carteiraApi, groupByStage, stageTotal,
} from '../../services/carteira';

const TABS = [['funil', 'Funil de captação'], ['contratos', 'Contratos de honorários']];
const NEXT = { novo: 'qualificacao', qualificacao: 'reuniao', reuniao: 'proposta' };

function Funil({ canWrite, onOpenClient }) {
    const { data, error, reload } = useLoader(() => carteiraApi.opportunities(), []);
    const [editing, setEditing] = useState(null);
    const [contracting, setContracting] = useState(null);
    const [showClosed, setShowClosed] = useState(false);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const groups = groupByStage(data.resultados);
    const r = data.resumo;
    const move = async (o, etapa) => {
        try { await carteiraApi.updateOpportunity(o.id, { etapa }); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    const columns = STAGES.filter(([k]) => showClosed || OPEN_STAGES.includes(k));
    return (
        <div className={styles.stack}>
            <div className={styles.grid}>
                <StatCard title="Em negociação" value={brl(OPEN_STAGES.reduce((s, k) => s + stageTotal(groups[k]), 0))}
                    note={`${OPEN_STAGES.reduce((s, k) => s + groups[k].length, 0)} oportunidade(s) abertas`} />
                <StatCard title="Conversão (90 dias)" value={r.conversao_pct == null ? '—' : `${r.conversao_pct}%`} note={`${r.ganhos} fechado(s), ${r.perdidos} perdido(s)`} />
                <StatCard title="Próximas ações atrasadas" value={r.acoes_atrasadas} tone={r.acoes_atrasadas ? 'red' : undefined} note="Retome o contato hoje" />
            </div>
            {r.motivos_perda?.length > 0 && (
                <p className={styles.muted}>Principais motivos de perda: {r.motivos_perda.map((m) => `${m.motivo} (${m.quantidade})`).join(' · ')}</p>
            )}
            <div className={styles.btn_row}>
                {canWrite && <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setEditing({})}>Nova oportunidade</button>}
                <label className={styles.check_row}><input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Mostrar fechadas e perdidas</label>
            </div>
            <div className={styles.kanban} role="list" aria-label="Funil de captação">
                {columns.map(([k, label]) => (
                    <section key={k} className={styles.kanban_col} role="listitem" aria-label={label}>
                        <header className={styles.kanban_head}><strong>{label}</strong><span className={styles.muted}>{groups[k].length} · {brl(stageTotal(groups[k]))}</span></header>
                        {groups[k].length === 0 && <div className={styles.muted} style={{ padding: 8 }}>—</div>}
                        {groups[k].map((o) => (
                            <article key={o.id} className={styles.kanban_card}>
                                <button type="button" className={styles.link_btn} onClick={() => onOpenClient(o.contato)}>{o.contato?.nome}</button>
                                <div><strong>{o.titulo}</strong></div>
                                <div className={styles.muted}>{o.origem_label}{o.valor_centavos ? ` · ${brl(o.valor_centavos)}` : ''}</div>
                                {o.proxima_acao && <div className={styles.muted} style={o.atrasada ? { color: 'var(--c-danger)' } : undefined}>
                                    {o.atrasada ? 'Atrasada: ' : 'Próxima: '}{o.proxima_acao}{o.proxima_acao_em ? ` (${fmtDate(o.proxima_acao_em)})` : ''}</div>}
                                {o.etapa === 'perdido' && o.motivo_perda && <div className={styles.muted}>Motivo: {o.motivo_perda}</div>}
                                {canWrite && (
                                    <div className={styles.btn_row} style={{ marginTop: 6 }}>
                                        {NEXT[o.etapa] && <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => move(o, NEXT[o.etapa])}>Avançar</button>}
                                        {['reuniao', 'proposta'].includes(o.etapa) && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_primary}`} onClick={() => setContracting(o)}>Fechar contrato</button>}
                                        <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} onClick={() => setEditing(o)}>Editar</button>
                                    </div>
                                )}
                            </article>
                        ))}
                    </section>
                ))}
            </div>
            {editing && <OpportunityForm initial={editing.id ? editing : null} onClose={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
            {contracting && <AgreementForm opportunity={contracting} onClose={() => setContracting(null)} onDone={() => { setContracting(null); reload(); }} />}
        </div>
    );
}

function AgreementDetail({ id, canManage, onClose, onChanged }) {
    const { data, error, reload } = useLoader(() => carteiraApi.agreement(id), [id]);
    const [success, setSuccess] = useState({ proveito: '', vencimento: new Date().toISOString().slice(0, 10) });
    const act = async (action, body, ok) => {
        try { await carteiraApi.agreementAction(id, action, body); toast.success(ok); reload(); onChanged(); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Contrato" onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                {error && <Banner tone="error">{error}</Banner>}
                {!data && !error && <Loading />}
                {data && (
                    <>
                        <div className={styles.modal_title}>{data.titulo}</div>
                        <p className={styles.muted}>{data.contato?.nome} · {data.tipo_label}{Number(data.exito_pct) ? ` · êxito ${data.exito_pct}%` : ''}
                            {data.processo ? ` · ${data.processo.cnj}` : ''} · <Pill tone={AGREEMENT_STATUS[data.status]?.[1]}>{AGREEMENT_STATUS[data.status]?.[0]}</Pill></p>
                        <div className={styles.table_wrap}>
                            <table className={styles.table}>
                                <thead><tr><th>Parcela</th><th>Valor</th><th>Vencimento</th><th>Situação</th></tr></thead>
                                <tbody>
                                    {data.lancamentos.length === 0 && <tr><td colSpan={4}><Empty>Sem parcelas (êxito ainda não apurado).</Empty></td></tr>}
                                    {data.lancamentos.map((r) => (
                                        <tr key={r.id}><td>{r.descricao}</td><td>{brl(r.valor_centavos)}</td><td>{fmtDate(r.vencimento)}</td>
                                            <td><Pill tone={r.vencido ? 'red' : REC_STATUS[r.status]?.[1]}>{r.vencido ? `Vencido há ${r.dias_atraso}d` : REC_STATUS[r.status]?.[0]}</Pill></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {['exito', 'misto'].includes(data.tipo) && data.status === 'ativo' && (
                            <form className={styles.filters} onSubmit={(e) => { e.preventDefault(); act('exito', success, 'Êxito lançado.'); }}>
                                <label className={styles.field}>Proveito econômico (R$)<input className={styles.input} inputMode="decimal" value={success.proveito} onChange={(e) => setSuccess({ ...success, proveito: e.target.value })} required /></label>
                                <label className={styles.field}>Vencimento<input className={styles.input} type="date" value={success.vencimento} onChange={(e) => setSuccess({ ...success, vencimento: e.target.value })} required /></label>
                                <button type="submit" className={styles.btn}>Registrar êxito</button>
                            </form>
                        )}
                        <div className={styles.btn_row}>
                            {canManage && data.status === 'ativo' && <button type="button" className={`${styles.btn} ${styles.btn_danger}`}
                                onClick={() => window.confirm('Cancelar o contrato e as parcelas em aberto?') && act('cancelar', null, 'Contrato cancelado.')}>Cancelar contrato</button>}
                            <button type="button" className={styles.btn} onClick={onClose}>Fechar</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Contratos({ canWrite, canManage }) {
    const { data, error, reload } = useLoader(() => carteiraApi.agreements(), []);
    const [creating, setCreating] = useState(false);
    const [open, setOpen] = useState(null);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <div className={styles.stack}>
            {canWrite && <div className={styles.btn_row}><button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setCreating(true)}>Novo contrato</button></div>}
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Contrato</th><th>Forma</th><th>Valor</th><th>Recebido</th><th>Em aberto</th><th>Situação</th></tr></thead>
                    <tbody>
                        {data.resultados.length === 0 && <tr><td colSpan={6}><Empty title="Nenhum contrato ainda">Feche uma oportunidade no funil ou crie o contrato aqui: as parcelas entram sozinhas em Finanças.</Empty></td></tr>}
                        {data.resultados.map((a) => (
                            <tr key={a.id} onClick={() => setOpen(a.id)} style={{ cursor: 'pointer' }}>
                                <td><strong>{a.titulo}</strong><div className={styles.muted}>{a.contato?.nome}</div></td>
                                <td>{a.tipo_label}{Number(a.exito_pct) ? <div className={styles.muted}>êxito {a.exito_pct}%</div> : null}</td>
                                <td>{a.tipo === 'exito' ? '—' : brl(a.valor_centavos)}{a.tipo === 'mensal' && <div className={styles.muted}>× {a.parcelas} meses</div>}</td>
                                <td>{brl(a.recebido_centavos)}</td>
                                <td>{brl(a.em_aberto_centavos)}</td>
                                <td><Pill tone={AGREEMENT_STATUS[a.status]?.[1]}>{AGREEMENT_STATUS[a.status]?.[0]}</Pill></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {creating && <AgreementForm onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
            {open && <AgreementDetail id={open} canManage={canManage} onClose={() => setOpen(null)} onChanged={reload} />}
        </div>
    );
}

// Carteira de clientes: funil de captação e contratos de honorários (CAD-175)
export default function Carteira() {
    const { role, isOrgManager } = useAuth();
    const canWrite = role !== 'VIEWER';
    const [tab, setTab] = useState('funil');
    const [client, setClient] = useState(null);
    return (
        <div className={styles.page}>
            <PageHeader title="Carteira de clientes" subtitle="Funil de captação e contratos" />
            <div className={styles.tabs} role="tablist">
                {TABS.map(([k, label]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${styles.tab} ${tab === k ? styles.tab_active : ''}`} onClick={() => setTab(k)}>{label}</button>
                ))}
            </div>
            {tab === 'funil' && <Funil canWrite={canWrite} onOpenClient={(c) => c && setClient({ id: c.id, name: c.nome })} />}
            {tab === 'contratos' && <Contratos canWrite={canWrite} canManage={isOrgManager} />}
            {client && <ClientFile contact={client} onClose={() => setClient(null)} />}
        </div>
    );
}
