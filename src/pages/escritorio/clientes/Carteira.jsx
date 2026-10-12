import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Empty, Field, FilterBar, Input, Loading, Modal, MoneyInput, PageHeader, Pill, Row, Stack, StatCard, Table, Tabs } from '../../../components/ui';
import { errorMessage, fmtDate } from '../../../utils/format';
import useAuth from '../../../hooks/useAuth';
import useLoader from '../../../hooks/useLoader';
import { AgreementForm, OpportunityForm } from '../../../components/carteira/Forms';
import ClientFile from '../../../components/carteira/ClientFile';
import {
    AGREEMENT_STATUS, OPEN_STAGES, REC_STATUS, STAGES, brl, carteiraApi, groupByStage, stageTotal,
} from '../../../services/carteira';

const TABS = [{ id: 'funil', label: 'Funil de captação' }, { id: 'contratos', label: 'Contratos de honorários' }];
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
        <Stack>
            <div className={styles.grid}>
                <StatCard title="Em negociação" value={brl(OPEN_STAGES.reduce((s, k) => s + stageTotal(groups[k]), 0))}
                    note={`${OPEN_STAGES.reduce((s, k) => s + groups[k].length, 0)} oportunidade(s) abertas`} />
                <StatCard title="Conversão (90 dias)" value={r.conversao_pct == null ? '—' : `${r.conversao_pct}%`} note={`${r.ganhos} fechado(s), ${r.perdidos} perdido(s)`} />
                <StatCard title="Próximas ações atrasadas" value={r.acoes_atrasadas} tone={r.acoes_atrasadas ? 'red' : undefined} note="Retome o contato hoje" />
            </div>
            {r.motivos_perda?.length > 0 && (
                <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Principais motivos de perda: {r.motivos_perda.map((m) => `${m.motivo} (${m.quantidade})`).join(' · ')}</p>
            )}
            <Row gap={4}>
                {canWrite && <Button variant="primary" onClick={() => setEditing({})}>Nova oportunidade</Button>}
                <Checkbox checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)}>Mostrar fechadas e perdidas</Checkbox>
            </Row>
            <div className={styles.kanban} role="list" aria-label="Funil de captação">
                {columns.map(([k, label]) => (
                    <section key={k} className={styles.kanban_col} role="listitem" aria-label={label}>
                        <header className={styles.kanban_head}><strong>{label}</strong><span className={styles.muted}>{groups[k].length} · {brl(stageTotal(groups[k]))}</span></header>
                        {groups[k].length === 0 && <div className={styles.muted}>—</div>}
                        {groups[k].map((o) => (
                            <article key={o.id} className={styles.kanban_card}>
                                <button type="button" className={styles.link_btn} onClick={() => onOpenClient(o.contato)}>{o.contato?.nome}</button>
                                <div><strong>{o.titulo}</strong></div>
                                <div className={styles.muted}>{o.origem_label}{o.valor_centavos ? ` · ${brl(o.valor_centavos)}` : ''}</div>
                                {o.proxima_acao && <div className={`${styles.muted} ${o.atrasada ? styles.text_danger : ''}`}>
                                    {o.atrasada ? 'Atrasada: ' : 'Próxima: '}{o.proxima_acao}{o.proxima_acao_em ? ` (${fmtDate(o.proxima_acao_em)})` : ''}</div>}
                                {o.etapa === 'perdido' && o.motivo_perda && <div className={styles.muted}>Motivo: {o.motivo_perda}</div>}
                                {canWrite && (
                                    <Row gap={1} className={styles.mt_2}>
                                        {NEXT[o.etapa] && <Button size="sm" onClick={() => move(o, NEXT[o.etapa])}>Avançar</Button>}
                                        {['reuniao', 'proposta'].includes(o.etapa) && <Button size="sm" variant="primary" onClick={() => setContracting(o)}>Fechar contrato</Button>}
                                        <Button size="sm" variant="ghost" onClick={() => setEditing(o)}>Editar</Button>
                                    </Row>
                                )}
                            </article>
                        ))}
                    </section>
                ))}
            </div>
            {editing && <OpportunityForm initial={editing.id ? editing : null} onClose={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
            {contracting && <AgreementForm opportunity={contracting} onClose={() => setContracting(null)} onDone={() => { setContracting(null); reload(); }} />}
        </Stack>
    );
}

function AgreementDetail({ id, canManage, onClose, onChanged }) {
    const { data, error, reload } = useLoader(() => carteiraApi.agreement(id), [id]);
    const [success, setSuccess] = useState({ proveito: '', vencimento: new Date().toISOString().slice(0, 10) });
    const act = async (action, body, ok) => {
        try { await carteiraApi.agreementAction(id, action, body); toast.success(ok); reload(); onChanged(); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        // Com o êxito sendo preenchido, clique fora não fecha
        <Modal title={data?.titulo || 'Contrato'} size="lg" onClose={onClose} closeOnOverlay={!success.proveito}
            footer={<>
                {canManage && data?.status === 'ativo' && <Button variant="danger"
                    onClick={() => window.confirm('Cancelar o contrato e as parcelas em aberto?') && act('cancelar', null, 'Contrato cancelado.')}>Cancelar contrato</Button>}
                <Button onClick={onClose}>Fechar</Button>
            </>}>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && (
                <>
                    <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>{data.contato?.nome} · {data.tipo_label}{Number(data.exito_pct) ? ` · êxito ${data.exito_pct}%` : ''}
                        {data.processo ? ` · ${data.processo.cnj}` : ''} · <Pill tone={AGREEMENT_STATUS[data.status]?.[1]}>{AGREEMENT_STATUS[data.status]?.[0]}</Pill></p>
                    <Table columns={['Parcela', 'Valor', 'Vencimento', 'Situação']}
                        empty={data.lancamentos.length === 0 && <Empty>Sem parcelas (êxito ainda não apurado).</Empty>}>
                        {data.lancamentos.map((r) => (
                            <tr key={r.id}><td>{r.descricao}</td><td data-label="Valor">{brl(r.valor_centavos)}</td><td data-label="Vencimento">{fmtDate(r.vencimento)}</td>
                                <td data-label="Situação"><Pill tone={r.vencido ? 'red' : REC_STATUS[r.status]?.[1]}>{r.vencido ? `Vencido há ${r.dias_atraso}d` : REC_STATUS[r.status]?.[0]}</Pill></td></tr>
                        ))}
                    </Table>
                    {['exito', 'misto'].includes(data.tipo) && data.status === 'ativo' && (
                        <FilterBar as="form" onSubmit={(e) => { e.preventDefault(); act('exito', success, 'Êxito lançado.'); }}>
                            <Field label="Proveito econômico (R$)"><MoneyInput value={success.proveito} onChange={(v) => setSuccess({ ...success, proveito: v })} required /></Field>
                            <Field label="Vencimento"><Input type="date" value={success.vencimento} onChange={(e) => setSuccess({ ...success, vencimento: e.target.value })} required /></Field>
                            <Button type="submit">Registrar êxito</Button>
                        </FilterBar>
                    )}
                </>
            )}
        </Modal>
    );
}

function Contratos({ canWrite, canManage }) {
    const { data, error, reload } = useLoader(() => carteiraApi.agreements(), []);
    const [creating, setCreating] = useState(false);
    const [open, setOpen] = useState(null);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <Stack>
            {canWrite && <Row><Button variant="primary" onClick={() => setCreating(true)}>Novo contrato</Button></Row>}
            <Table columns={['Contrato', 'Forma', 'Valor', 'Recebido', 'Em aberto', 'Situação']}
                empty={data.resultados.length === 0 && <Empty title="Nenhum contrato ainda">Feche uma oportunidade no funil ou crie o contrato aqui: as parcelas entram sozinhas em Finanças.</Empty>}>
                {data.resultados.map((a) => (
                    <tr key={a.id} className={styles.clickable} tabIndex={0} onClick={() => setOpen(a.id)} onKeyDown={(e) => e.key === 'Enter' && setOpen(a.id)}>
                        <td><strong>{a.titulo}</strong><div className={styles.muted}>{a.contato?.nome}</div></td>
                        <td data-label="Forma">{a.tipo_label}{Number(a.exito_pct) ? <div className={styles.muted}>êxito {a.exito_pct}%</div> : null}</td>
                        <td data-label="Valor">{a.tipo === 'exito' ? '—' : brl(a.valor_centavos)}{a.tipo === 'mensal' && <div className={styles.muted}>× {a.parcelas} meses</div>}</td>
                        <td data-label="Recebido">{brl(a.recebido_centavos)}</td>
                        <td data-label="Em aberto">{brl(a.em_aberto_centavos)}</td>
                        <td data-label="Situação"><Pill tone={AGREEMENT_STATUS[a.status]?.[1]}>{AGREEMENT_STATUS[a.status]?.[0]}</Pill></td>
                    </tr>
                ))}
            </Table>
            {creating && <AgreementForm onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
            {open && <AgreementDetail id={open} canManage={canManage} onClose={() => setOpen(null)} onChanged={reload} />}
        </Stack>
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
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
            {tab === 'funil' && <Funil canWrite={canWrite} onOpenClient={(c) => c && setClient({ id: c.id, name: c.nome })} />}
            {tab === 'contratos' && <Contratos canWrite={canWrite} canManage={isOrgManager} />}
            {client && <ClientFile contact={client} onClose={() => setClient(null)} />}
        </div>
    );
}
