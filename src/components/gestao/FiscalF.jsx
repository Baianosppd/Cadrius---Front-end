import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, StatusPill, errorMessage, fmtDate, fmtDateTime } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
import { NF_STATUS, OBLIGATION_STATUS, backofficeApi } from '../../services/backoffice';

const brl = (v) => `R$ ${String(v).replace('.', ',')}`;
const ADJUST_LABEL = { antecipa: 'antecipa', posterga: 'posterga', ultimo_util: 'último dia útil' };

// Fase 2 do Fiscal (CAD-175): conferir a NFS-e antes de emitir pelo emissor; acompanhar, atualizar e cancelar
export function NfseModal({ payment, onClose, onChanged }) {
    const { data, error, reload } = useLoader(() => backofficeApi.fiscalNfse(payment.id), [payment.id]);
    const [reason, setReason] = useState('');
    const [just, setJust] = useState('');
    const [busy, setBusy] = useState(false);
    const act = async (body, ok) => {
        setBusy(true);
        try { const r = await backofficeApi.fiscalNfseAction(payment.id, body); toast.success(ok(r)); reload(); onChanged(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const st = data?.pagamento?.nf_status;
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Conferir NFS-e" onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: 720, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modal_title}>NFS-e — {payment.tomador.nome}</div>
                {error && <Banner tone="error">{error}</Banner>}
                {!data && !error && <Empty>Montando a nota…</Empty>}
                {data && (
                    <>
                        <div><StatusPill map={NF_STATUS} value={st} />{data.pagamento.nf_numero && <span className={styles.muted}> nº {data.pagamento.nf_numero}</span>}</div>
                        {data.pagamento.nfse_erro && <Banner tone="error">Emissor: {data.pagamento.nfse_erro}</Banner>}
                        {!data.automatico && <Banner tone="info">Emissor não configurado: emita no portal da prefeitura/emissor e use "Registrar NF". Para emitir daqui, configure o FOCUSNFE_TOKEN no servidor.</Banner>}
                        {data.faltando.length > 0 && <Banner tone="warn"><strong>Antes de emitir:</strong><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{data.faltando.map((f) => <li key={f}>{f}</li>)}</ul></Banner>}
                        <div className={styles.card_grid}>
                            <div className={styles.card}><div className={styles.card_title}>Tomador</div>
                                <div>{data.nota.tomador.razao_social}</div><div className={styles.muted}>{data.nota.tomador.cnpj || data.nota.tomador.cpf || 'sem documento'} · {data.nota.tomador.email}</div></div>
                            <div className={styles.card}><div className={styles.card_title}>Valores</div>
                                <div>Serviço: {brl(data.nota.servico.valor_servicos)}</div>
                                <div className={styles.muted}>ISS ({data.nota.servico.aliquota}%): {brl(data.iss)}</div>
                                {data.retencoes.map((r) => <div key={r.tributo} className={styles.muted}>Retenção {r.tributo} ({r.aliquota}%): {brl(r.valor)}</div>)}
                            </div>
                            <div className={styles.card}><div className={styles.card_title}>Reforma tributária</div>
                                <div className={styles.muted}>CBS {data.reforma.cbs_pct}%: {brl(data.reforma.cbs)} · IBS {data.reforma.ibs_pct}%: {brl(data.reforma.ibs)}</div>
                                <div className={styles.muted}>{data.reforma.observacao}</div></div>
                        </div>
                        <label className={styles.field}>Discriminação<textarea className={styles.textarea} readOnly value={data.nota.servico.discriminacao} /></label>
                        {data.automatico && ['pending', 'error', 'canceled'].includes(st) && (
                            <div className={styles.filters}>
                                <label className={styles.field} style={{ flex: 2 }}>Conferência (obrigatório)<input className={styles.input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: conferido valor e tomador" /></label>
                                <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || data.faltando.length > 0 || reason.trim().length < 5}
                                    onClick={() => act({ acao: 'emitir', reason }, (r) => (r.nf_status === 'issued' ? `NFS-e nº ${r.nf_numero} emitida.` : 'Enviada ao emissor.'))}>Emitir NFS-e</button>
                            </div>
                        )}
                        {st === 'processing' && <button type="button" className={styles.btn} disabled={busy} onClick={() => act({ acao: 'atualizar' }, () => 'Situação atualizada.')}>Atualizar situação</button>}
                        {data.pagamento.nfse_url && <a className={styles.btn} href={data.pagamento.nfse_url} target="_blank" rel="noreferrer noopener">Abrir a nota</a>}
                        {st === 'issued' && (
                            <div className={styles.filters}>
                                <label className={styles.field} style={{ flex: 2 }}>Justificativa do cancelamento (mín. 15 caracteres)<input className={styles.input} value={just} onChange={(e) => setJust(e.target.value)} /></label>
                                <button type="button" className={`${styles.btn} ${styles.btn_danger}`} disabled={busy || just.trim().length < 15}
                                    onClick={() => window.confirm('Cancelar esta nota fiscal?') && act({ acao: 'cancelar', justificativa: just }, () => 'Nota cancelada.')}>Cancelar nota</button>
                            </div>
                        )}
                    </>
                )}
                <div className={styles.btn_row}><button type="button" className={styles.btn} onClick={onClose}>Fechar</button></div>
            </div>
        </div>
    );
}

// Fase 3 do Fiscal: calendário de obrigações da Cadrius (editável; prazos a validar com o contador)
export function Obrigacoes() {
    const { data, error, reload } = useLoader(() => backofficeApi.fiscalObligations(), []);
    const [editing, setEditing] = useState(null);
    const done = async (row, undo = false) => {
        try {
            await backofficeApi.fiscalObligationDone(row.obrigacao_id, { competencia: row.competencia, desfazer: undo });
            toast.success(undo ? 'Marcação desfeita.' : 'Marcada como feita.');
            reload();
        } catch (err) { toast.error(errorMessage(err)); }
    };
    const save = async (e) => {
        e.preventDefault();
        try { await backofficeApi.fiscalObligationUpdate(editing); toast.success('Obrigação atualizada.'); setEditing(null); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    return (
        <div className={styles.stack}>
            <Banner tone="info">Prazos-padrão a <strong>validar com o contador</strong> (mudam por norma e por município). Dia útil considera fins de semana e feriados nacionais. A equipe Fiscal recebe aviso 5 dias e 1 dia antes.</Banner>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Obrigação</th><th>Competência</th><th>Vencimento</th><th>Situação</th><th /></tr></thead>
                    <tbody>
                        {data.proximos.length === 0 && <tr><td colSpan={5}><Empty>Nada vencendo nos próximos 60 dias.</Empty></td></tr>}
                        {data.proximos.map((r) => (
                            <tr key={`${r.codigo}-${r.competencia}`}>
                                <td><strong>{r.nome}</strong><div className={styles.muted}>{r.descricao}</div></td>
                                <td>{r.competencia.split('-').reverse().join('/')}</td>
                                <td>{fmtDate(r.vencimento)}{r.situacao !== 'feito' && <div className={styles.muted}>{r.dias >= 0 ? `em ${r.dias} dia(s)` : `${-r.dias} dia(s) de atraso`}</div>}</td>
                                <td><StatusPill map={OBLIGATION_STATUS} value={r.situacao} />{r.feito_em && <div className={styles.muted}>{fmtDateTime(r.feito_em)} · {r.feito_por}</div>}</td>
                                <td>{r.situacao === 'feito'
                                    ? <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} onClick={() => done(r, true)}>Desfazer</button>
                                    : <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_primary}`} onClick={() => done(r)}>Marcar como feita</button>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={styles.section_title}>Cadastro das obrigações</div>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Obrigação</th><th>Vencimento</th><th>Ativa</th><th /></tr></thead>
                    <tbody>
                        {data.obrigacoes.map((o) => (
                            <tr key={o.id}>
                                <td>{o.nome}</td>
                                <td>{o.ajuste === 'ultimo_util' ? 'Último dia útil' : `Dia ${o.dia}`}{o.periodicidade === 'anual' ? ` de ${String(o.mes).padStart(2, '0')}` : ' do mês seguinte'}
                                    <div className={styles.muted}>se não for dia útil: {ADJUST_LABEL[o.ajuste]}</div></td>
                                <td>{o.ativa ? 'Sim' : 'Não'}</td>
                                <td><button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => setEditing({ id: o.id, nome: o.nome, dia: o.dia, mes: o.mes, ajuste: o.ajuste, ativa: o.ativa, anual: o.periodicidade === 'anual', reason: '' })}>Editar</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editing && (
                <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Editar obrigação" onClick={() => setEditing(null)}>
                    <form className={styles.modal} style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()} onSubmit={save}>
                        <div className={styles.modal_title}>{editing.nome}</div>
                        <div className={styles.filters}>
                            <label className={styles.field}>Dia<input className={styles.input} type="number" min={0} max={31} value={editing.dia} onChange={(e) => setEditing({ ...editing, dia: e.target.value })} /></label>
                            {editing.anual && <label className={styles.field}>Mês<input className={styles.input} type="number" min={1} max={12} value={editing.mes} onChange={(e) => setEditing({ ...editing, mes: e.target.value })} /></label>}
                            <label className={styles.field}>Se não for dia útil
                                <select className={styles.select} value={editing.ajuste} onChange={(e) => setEditing({ ...editing, ajuste: e.target.value })}>
                                    {data.ajustes.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                </select>
                            </label>
                        </div>
                        <label className={styles.check_row}><input type="checkbox" checked={editing.ativa} onChange={(e) => setEditing({ ...editing, ativa: e.target.checked })} /> Ativa</label>
                        <label className={styles.field}>Motivo da mudança<input className={styles.input} value={editing.reason} onChange={(e) => setEditing({ ...editing, reason: e.target.value })} required minLength={5} /></label>
                        <div className={styles.btn_row}>
                            <button type="submit" className={`${styles.btn} ${styles.btn_primary}`}>Salvar</button>
                            <button type="button" className={styles.btn} onClick={() => setEditing(null)}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
