import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import { Banner, Button, Checkbox, Empty, Field, FilterBar, Input, Loading, Modal, Pill, Row, Stack, StatCard, Table, Tabs } from '../ui';
import { errorMessage, fmtDate, fmtDateTime } from '../../utils/format';
import useAuth from '../../hooks/useAuth';
import useLoader from '../../hooks/useLoader';
import { AgreementForm, OpportunityForm } from './Forms';
import { AGREEMENT_STATUS, REC_STATUS, brl, carteiraApi, portalApi } from '../../services/carteira';

const LINK_TONE = { ativo: 'green', expirado: 'gray', revogado: 'red' };
const TABS = [{ id: 'resumo', label: 'Carteira' }, { id: 'portal', label: 'Portal do cliente' }];

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
        <Stack>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>O cliente acompanha os processos vinculados a ele (andamentos em linguagem simples) e, se você quiser, os honorários
                em aberto com o link de pagamento. Sem documentos nem anotações internas. O link é pessoal e pode ser revogado.</p>
            {error && <Banner tone="error">{error}</Banner>}
            {canWrite && (
                <FilterBar>
                    <Field label="Validade (dias)"><Input type="number" min={1} max={365} value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} /></Field>
                    <Checkbox checked={form.mostrar_financeiro} onChange={(e) => setForm({ ...form, mostrar_financeiro: e.target.checked })}>Mostrar honorários</Checkbox>
                    <Checkbox checked={form.enviar_email} onChange={(e) => setForm({ ...form, enviar_email: e.target.checked })}>Enviar por e-mail</Checkbox>
                    <Button variant="primary" loading={busy} onClick={create}>Gerar link do portal</Button>
                </FilterBar>
            )}
            {created && (
                <Banner tone="ok">
                    <div>Link criado. Ele aparece só agora — copie e envie ao cliente:</div>
                    <code className={styles.break_all}>{created.url}</code>
                    <Row className={styles.mt_2}><Button size="sm" onClick={() => copy(created.url)}>Copiar link</Button></Row>
                </Banner>
            )}
            {data?.length > 0 && (
                <Table columns={['Link', 'Situação', 'Acessos', { label: '', className: styles.td_actions }]}>
                    {data.map((l) => (
                        <tr key={l.id}>
                            <td>…{l.final}<div className={styles.muted}>até {fmtDate(l.expira_em)}{l.mostra_financeiro ? ' · com honorários' : ''}</div></td>
                            <td data-label="Situação"><Pill tone={LINK_TONE[l.situacao]}>{l.situacao}</Pill></td>
                            <td data-label="Acessos">{l.acessos}<div className={styles.muted}>{l.ultimo_acesso ? fmtDateTime(l.ultimo_acesso) : 'nunca'}</div></td>
                            <td className={styles.td_actions}>{canWrite && l.situacao === 'ativo' && <Button size="sm" variant="danger" onClick={() => revoke(l.id)}>Revogar</Button>}</td>
                        </tr>
                    ))}
                </Table>
            )}
        </Stack>
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
        <Modal title={contact.name} size="xl" onClose={onClose}
            footer={<Button onClick={onClose}>Fechar</Button>}>
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && tab === 'resumo' && (
                <Stack>
                    {data.financeiro && (
                        <div className={styles.card_grid}>
                            <StatCard title="Em aberto" value={brl(data.financeiro.em_aberto_centavos)} />
                            <StatCard title="Vencido" value={brl(data.financeiro.vencido_centavos)} tone={data.financeiro.vencido_centavos ? 'red' : undefined} />
                            <StatCard title="Recebido" value={brl(data.financeiro.recebido_centavos)} />
                        </div>
                    )}
                    {canWrite && (
                        <Row>
                            <Button onClick={() => setForm('opp')}>Nova oportunidade</Button>
                            <Button onClick={() => setForm('contrato')}>Novo contrato</Button>
                        </Row>
                    )}
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Oportunidades</div>
                    {data.oportunidades.length === 0 ? <Empty>Nenhuma.</Empty> : data.oportunidades.map((o) => (
                        <div key={o.id}><strong>{o.titulo}</strong> <Pill tone={o.etapa === 'ganho' ? 'green' : o.etapa === 'perdido' ? 'gray' : 'blue'}>{o.etapa_label}</Pill></div>
                    ))}
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Contratos</div>
                    {data.contratos.length === 0 ? <Empty>Nenhum.</Empty> : data.contratos.map((a) => (
                        <div key={a.id}><strong>{a.titulo}</strong> · {a.tipo_label} · recebido {brl(a.recebido_centavos)} · em aberto {brl(a.em_aberto_centavos)}{' '}
                            <Pill tone={AGREEMENT_STATUS[a.status]?.[1]}>{AGREEMENT_STATUS[a.status]?.[0]}</Pill></div>
                    ))}
                    {data.financeiro && (
                        <>
                            <div className={`${styles.section_title} ${styles.mb_0}`}>Lançamentos</div>
                            {data.financeiro.lancamentos.length === 0 ? <Empty>Nenhum.</Empty> : (
                                <ul className={styles.list_indent}>
                                    {data.financeiro.lancamentos.map((r) => (
                                        <li key={r.id}>{r.descricao}: {brl(r.valor_centavos)} — {fmtDate(r.vencimento)} <Pill tone={r.vencido ? 'red' : REC_STATUS[r.status]?.[1]}>{r.vencido ? 'vencido' : REC_STATUS[r.status]?.[0]}</Pill></li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Processos</div>
                    {data.processos.length === 0 ? <Empty>Nenhum processo vinculado (vincule em Processos acompanhados).</Empty>
                        : data.processos.map((p) => <div key={p.id}>{p.cnj}{p.apelido ? ` — ${p.apelido}` : ''}</div>)}
                </Stack>
            )}
            {data && tab === 'portal' && <PortalLinks contact={contact} canWrite={canWrite} />}
            {form === 'opp' && <OpportunityForm initial={{ contato: { id: contact.id, nome: contact.name } }} onClose={() => setForm(null)} onDone={() => { setForm(null); reload(); }} />}
            {form === 'contrato' && <AgreementForm contact={contact} onClose={() => setForm(null)} onDone={() => { setForm(null); reload(); }} />}
        </Modal>
    );
}
