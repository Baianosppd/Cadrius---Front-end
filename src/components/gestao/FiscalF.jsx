import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import { FiExternalLink } from 'react-icons/fi';
import { Banner, Button, Checkbox, Empty, Field, FilterBar, FormModal, Input, Loading, Modal, Row, Select, StatusPill, Table, Textarea } from '../ui';
import { errorMessage, fmtDate, fmtDateTime } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
import { NF_STATUS, OBLIGATION_STATUS, backofficeApi } from '../../services/backoffice';

const brl = (v) => `R$ ${String(v).replace('.', ',')}`;
const ADJUST_LABEL = { antecipa: 'antecipa', posterga: 'posterga', ultimo_util: 'último dia útil' };

// Fase 2 do Fiscal (CAD-175): conferir a NFS-e antes de emitir pelo emissor; acompanhar, atualizar e cancelar
export function NfseModal({ payment, onClose, onChanged }) {
    const { data, error, reload } = useLoader(() => backofficeApi.fiscalNfse(payment.id), [payment.id]);
    const [reason, setReason] = useState('');
    const [just, setJust] = useState('');
    const [busy, setBusy] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const act = async (body, ok) => {
        setBusy(true);
        try { const r = await backofficeApi.fiscalNfseAction(payment.id, body); toast.success(ok(r)); reload(); onChanged(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const st = data?.pagamento?.nf_status;
    return (
        <Modal title={`NFS-e — ${payment.tomador.nome}`} size="lg" onClose={onClose} busy={busy}
            footer={<Button className={styles.ml_auto} onClick={onClose} disabled={busy}>Fechar</Button>}>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Montando a nota…</Empty>}
            {data && (
                <>
                    <div><StatusPill map={NF_STATUS} value={st} />{data.pagamento.nf_numero && <span className={styles.muted}> nº {data.pagamento.nf_numero}</span>}</div>
                    {data.pagamento.nfse_erro && <Banner tone="error">Emissor: {data.pagamento.nfse_erro}</Banner>}
                    {!data.automatico && <Banner tone="info">Emissor não configurado: emita no portal da prefeitura/emissor e use "Registrar NF". Para emitir daqui, configure o FOCUSNFE_TOKEN no servidor.</Banner>}
                    {data.faltando.length > 0 && <Banner tone="warn"><strong>Antes de emitir:</strong><ul className={styles.list_indent}>{data.faltando.map((f) => <li key={f}>{f}</li>)}</ul></Banner>}
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
                    <Field label="Discriminação"><Textarea readOnly value={data.nota.servico.discriminacao} /></Field>
                    {data.automatico && ['pending', 'error', 'canceled'].includes(st) && (
                        <FilterBar>
                            <Field label="Conferência" hint="Obrigatório" className={styles.flex_2}><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: conferido valor e tomador" /></Field>
                            <Button variant="primary" loading={busy} disabled={data.faltando.length > 0 || reason.trim().length < 5}
                                onClick={() => act({ acao: 'emitir', reason }, (r) => (r.nf_status === 'issued' ? `NFS-e nº ${r.nf_numero} emitida.` : 'Enviada ao emissor.'))}>Emitir NFS-e</Button>
                        </FilterBar>
                    )}
                    {(st === 'processing' || data.pagamento.nfse_url) && (
                        <Row gap={1}>
                            {st === 'processing' && <Button loading={busy} onClick={() => act({ acao: 'atualizar' }, () => 'Situação atualizada.')}>Atualizar situação</Button>}
                            {data.pagamento.nfse_url && <Button as="a" icon={FiExternalLink} href={data.pagamento.nfse_url} target="_blank" rel="noreferrer noopener">Abrir a nota</Button>}
                        </Row>
                    )}
                    {st === 'issued' && (
                        <FilterBar>
                            <Field label="Justificativa do cancelamento" hint="Mínimo de 15 caracteres" className={styles.flex_2}><Input value={just} onChange={(e) => setJust(e.target.value)} /></Field>
                            <Button variant="danger" loading={busy} disabled={just.trim().length < 15}
                                onClick={() => setConfirming(true)}>Cancelar nota</Button>
                        </FilterBar>
                    )}
                </>
            )}
            {confirming && (
                <Modal title="Cancelar esta nota fiscal?" size="sm" onClose={() => setConfirming(false)} busy={busy}
                    footer={<>
                        <Button onClick={() => setConfirming(false)} disabled={busy}>Voltar</Button>
                        <Button variant="danger" loading={busy}
                            onClick={async () => { await act({ acao: 'cancelar', justificativa: just }, () => 'Nota cancelada.'); setConfirming(false); }}>Cancelar nota</Button>
                    </>}>
                    <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>O cancelamento é enviado ao emissor e não pode ser desfeito.</p>
                </Modal>
            )}
        </Modal>
    );
}

// Fase 3 do Fiscal: calendário de obrigações da Cadrius (editável; prazos a validar com o contador)
export function Obrigacoes() {
    const { data, error, reload } = useLoader(() => backofficeApi.fiscalObligations(), []);
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState(false);
    const [saveError, setSaveError] = useState('');
    const done = async (row, undo = false) => {
        try {
            await backofficeApi.fiscalObligationDone(row.obrigacao_id, { competencia: row.competencia, desfazer: undo });
            toast.success(undo ? 'Marcação desfeita.' : 'Marcada como feita.');
            reload();
        } catch (err) { toast.error(errorMessage(err)); }
    };
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setSaveError('');
        try { await backofficeApi.fiscalObligationUpdate(editing); toast.success('Obrigação atualizada.'); setEditing(null); reload(); } catch (err) { setSaveError(errorMessage(err)); } finally { setBusy(false); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <div className={styles.stack}>
            <Banner tone="info">Prazos-padrão a <strong>validar com o contador</strong> (mudam por norma e por município). Dia útil considera fins de semana e feriados nacionais. A equipe Fiscal recebe aviso 5 dias e 1 dia antes.</Banner>
            <Table columns={['Obrigação', 'Competência', 'Vencimento', 'Situação', { label: '', className: styles.td_actions }]}
                empty={data.proximos.length === 0 && <Empty>Nada vencendo nos próximos 60 dias.</Empty>}>
                {data.proximos.map((r) => (
                    <tr key={`${r.codigo}-${r.competencia}`}>
                        <td><strong>{r.nome}</strong><div className={styles.muted}>{r.descricao}</div></td>
                        <td data-label="Competência">{r.competencia.split('-').reverse().join('/')}</td>
                        <td data-label="Vencimento">{fmtDate(r.vencimento)}{r.situacao !== 'feito' && <div className={styles.muted}>{r.dias >= 0 ? `em ${r.dias} dia(s)` : `${-r.dias} dia(s) de atraso`}</div>}</td>
                        <td data-label="Situação"><StatusPill map={OBLIGATION_STATUS} value={r.situacao} />{r.feito_em && <div className={styles.muted}>{fmtDateTime(r.feito_em)} · {r.feito_por}</div>}</td>
                        <td className={styles.td_actions}>{r.situacao === 'feito'
                            ? <Button size="sm" variant="ghost" onClick={() => done(r, true)}>Desfazer</Button>
                            : <Button size="sm" variant="primary" onClick={() => done(r)}>Marcar como feita</Button>}</td>
                    </tr>
                ))}
            </Table>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Cadastro das obrigações</div>
            <Table columns={['Obrigação', 'Vencimento', 'Ativa', { label: '', className: styles.td_actions }]}>
                {data.obrigacoes.map((o) => (
                    <tr key={o.id}>
                        <td>{o.nome}</td>
                        <td data-label="Vencimento">{o.ajuste === 'ultimo_util' ? 'Último dia útil' : `Dia ${o.dia}`}{o.periodicidade === 'anual' ? ` de ${String(o.mes).padStart(2, '0')}` : ' do mês seguinte'}
                            <div className={styles.muted}>se não for dia útil: {ADJUST_LABEL[o.ajuste]}</div></td>
                        <td data-label="Ativa">{o.ativa ? 'Sim' : 'Não'}</td>
                        <td className={styles.td_actions}><Button size="sm" onClick={() => setEditing({ id: o.id, nome: o.nome, dia: o.dia, mes: o.mes, ajuste: o.ajuste, ativa: o.ativa, anual: o.periodicidade === 'anual', reason: '' })}>Editar</Button></td>
                    </tr>
                ))}
            </Table>
            {editing && (
                <FormModal title={editing.nome} onClose={() => { setEditing(null); setSaveError(''); }} onSubmit={save} busy={busy} error={saveError}>
                    <FilterBar>
                        <Field label="Dia"><Input type="number" min={0} max={31} value={editing.dia} onChange={(e) => setEditing({ ...editing, dia: e.target.value })} /></Field>
                        {editing.anual && <Field label="Mês"><Input type="number" min={1} max={12} value={editing.mes} onChange={(e) => setEditing({ ...editing, mes: e.target.value })} /></Field>}
                        <Field label="Se não for dia útil">
                            <Select value={editing.ajuste} onChange={(e) => setEditing({ ...editing, ajuste: e.target.value })}>
                                {data.ajustes.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                            </Select>
                        </Field>
                    </FilterBar>
                    <Checkbox checked={editing.ativa} onChange={(e) => setEditing({ ...editing, ativa: e.target.checked })}>Ativa</Checkbox>
                    <Field label="Motivo da mudança"><Input value={editing.reason} onChange={(e) => setEditing({ ...editing, reason: e.target.value })} required minLength={5} /></Field>
                </FormModal>
            )}
        </div>
    );
}
