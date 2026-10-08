import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, errorMessage, fmtDate, fmtDateTime, Loading, Pill } from '../seguranca/ui';
import useAuth from '../../hooks/useAuth';
import useLoader from '../../pages/gestao/useLoader';
import { AgreementForm, OpportunityForm } from './Forms';
import { AGREEMENT_STATUS, REC_STATUS, brl, carteiraApi, portalApi } from '../../services/carteira';

const LINK_TONE = { ativo: 'green', expirado: 'gray', revogado: 'red' };

// Portal do cliente: link pessoal (só o hash fica no servidor), com validade e revogação
export function PortalLinks({ contact, canWrite }) {
    const { data, error, reload } = useLoader(() => portalApi.links(contact.id), [contact.id]);
    const [form, setForm] = useState({ dias: 90, mostrar_financeiro: true, enviar_email: false });
    const [created, setCreated] = useState(null);
    const [busy, setBusy] = useState(false);
    const create = async () => {
        setBusy(true);
        try {
            const r = await portalApi.create({ contato_id: contact.id, ...form });
            setCreated(r);
            if (r.envio === 'email') toast.success('Link enviado por e-mail ao cliente.');
            if (r.envio === 'sem_consentimento') toast.info('O cliente não autorizou e-mail: copie o link e envie por outro canal.');
            reload();
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const copy = async (url) => {
        try { await navigator.clipboard.writeText(url); toast.success('Link copiado.'); } catch { toast.info('Selecione e copie o link.'); }
    };
    const revoke = async (id) => {
        if (!window.confirm('Revogar este link? O cliente perde o acesso na hora.')) return;
        try { await portalApi.revoke(id); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <div className={styles.stack}>
            <p className={styles.muted}>O cliente acompanha os processos vinculados a ele (andamentos em linguagem simples) e, se você quiser, os honorários
                em aberto com o link de pagamento. Sem documentos nem anotações internas. O link é pessoal e pode ser revogado.</p>
            {error && <Banner tone="error">{error}</Banner>}
            {canWrite && (
                <div className={styles.filters}>
                    <label className={styles.field}>Validade (dias)<input className={styles.input} type="number" min={1} max={365} value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} /></label>
                    <label className={styles.check_row}><input type="checkbox" checked={form.mostrar_financeiro} onChange={(e) => setForm({ ...form, mostrar_financeiro: e.target.checked })} /> Mostrar honorários</label>
                    <label className={styles.check_row}><input type="checkbox" checked={form.enviar_email} onChange={(e) => setForm({ ...form, enviar_email: e.target.checked })} /> Enviar por e-mail</label>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={create} disabled={busy}>Gerar link do portal</button>
                </div>
            )}
            {created && (
                <Banner tone="ok">
                    <div>Link criado. Ele aparece só agora — copie e envie ao cliente:</div>
                    <code style={{ wordBreak: 'break-all' }}>{created.url}</code>
                    <div className={styles.btn_row} style={{ marginTop: 6 }}><button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => copy(created.url)}>Copiar link</button></div>
                </Banner>
            )}
            {data?.length > 0 && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Link</th><th>Situação</th><th>Acessos</th><th></th></tr></thead>
                        <tbody>
                            {data.map((l) => (
                                <tr key={l.id}>
                                    <td>…{l.final}<div className={styles.muted}>até {fmtDate(l.expira_em)}{l.mostra_financeiro ? ' · com honorários' : ''}</div></td>
                                    <td><Pill tone={LINK_TONE[l.situacao]}>{l.situacao}</Pill></td>
                                    <td>{l.acessos}<div className={styles.muted}>{l.ultimo_acesso ? fmtDateTime(l.ultimo_acesso) : 'nunca'}</div></td>
                                    <td>{canWrite && l.situacao === 'ativo' && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_danger}`} onClick={() => revoke(l.id)}>Revogar</button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Ficha do cliente na carteira: oportunidades, contratos, financeiro, processos e portal
export default function ClientFile({ contact, onClose }) {
    const { role } = useAuth();
    const canWrite = role !== 'VIEWER';
    const { data, error, reload } = useLoader(() => carteiraApi.client(contact.id), [contact.id]);
    const [tab, setTab] = useState('resumo');
    const [form, setForm] = useState(null);
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`Ficha de ${contact.name}`} onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: 860, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modal_title}>{contact.name}</div>
                <div className={styles.tabs} role="tablist">
                    {[['resumo', 'Carteira'], ['portal', 'Portal do cliente']].map(([k, l]) => (
                        <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${styles.tab} ${tab === k ? styles.tab_active : ''}`} onClick={() => setTab(k)}>{l}</button>
                    ))}
                </div>
                {error && <Banner tone="error">{error}</Banner>}
                {!data && !error && <Loading />}
                {data && tab === 'resumo' && (
                    <div className={styles.stack}>
                        {data.financeiro && (
                            <div className={styles.card_grid}>
                                <div className={styles.card}><div className={styles.card_title}>Em aberto</div><div className={styles.card_value}>{brl(data.financeiro.em_aberto_centavos)}</div></div>
                                <div className={styles.card}><div className={styles.card_title}>Vencido</div><div className={styles.card_value} style={data.financeiro.vencido_centavos ? { color: 'var(--c-danger)' } : undefined}>{brl(data.financeiro.vencido_centavos)}</div></div>
                                <div className={styles.card}><div className={styles.card_title}>Recebido</div><div className={styles.card_value}>{brl(data.financeiro.recebido_centavos)}</div></div>
                            </div>
                        )}
                        {canWrite && (
                            <div className={styles.btn_row}>
                                <button type="button" className={styles.btn} onClick={() => setForm('opp')}>Nova oportunidade</button>
                                <button type="button" className={styles.btn} onClick={() => setForm('contrato')}>Novo contrato</button>
                            </div>
                        )}
                        <div className={styles.section_title}>Oportunidades</div>
                        {data.oportunidades.length === 0 ? <Empty>Nenhuma.</Empty> : data.oportunidades.map((o) => (
                            <div key={o.id}><strong>{o.titulo}</strong> <Pill tone={o.etapa === 'ganho' ? 'green' : o.etapa === 'perdido' ? 'gray' : 'blue'}>{o.etapa_label}</Pill></div>
                        ))}
                        <div className={styles.section_title}>Contratos</div>
                        {data.contratos.length === 0 ? <Empty>Nenhum.</Empty> : data.contratos.map((a) => (
                            <div key={a.id}><strong>{a.titulo}</strong> · {a.tipo_label} · recebido {brl(a.recebido_centavos)} · em aberto {brl(a.em_aberto_centavos)}{' '}
                                <Pill tone={AGREEMENT_STATUS[a.status]?.[1]}>{AGREEMENT_STATUS[a.status]?.[0]}</Pill></div>
                        ))}
                        {data.financeiro && (
                            <>
                                <div className={styles.section_title}>Lançamentos</div>
                                {data.financeiro.lancamentos.length === 0 ? <Empty>Nenhum.</Empty> : (
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                        {data.financeiro.lancamentos.map((r) => (
                                            <li key={r.id}>{r.descricao}: {brl(r.valor_centavos)} — {fmtDate(r.vencimento)} <Pill tone={r.vencido ? 'red' : REC_STATUS[r.status]?.[1]}>{r.vencido ? 'vencido' : REC_STATUS[r.status]?.[0]}</Pill></li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                        <div className={styles.section_title}>Processos</div>
                        {data.processos.length === 0 ? <Empty>Nenhum processo vinculado (vincule em Processos acompanhados).</Empty>
                            : data.processos.map((p) => <div key={p.id}>{p.cnj}{p.apelido ? ` — ${p.apelido}` : ''}</div>)}
                    </div>
                )}
                {data && tab === 'portal' && <PortalLinks contact={contact} canWrite={canWrite} />}
                <div className={styles.btn_row} style={{ marginTop: 12 }}><button type="button" className={styles.btn} onClick={onClose}>Fechar</button></div>
                {form === 'opp' && <OpportunityForm initial={{ contato: { id: contact.id, nome: contact.name } }} onClose={() => setForm(null)} onDone={() => { setForm(null); reload(); }} />}
                {form === 'contrato' && <AgreementForm contact={contact} onClose={() => setForm(null)} onDone={() => { setForm(null); reload(); }} />}
            </div>
        </div>
    );
}
