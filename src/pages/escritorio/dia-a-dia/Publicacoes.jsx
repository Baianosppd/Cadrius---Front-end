import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Empty, Field, FilterBar, Input, Modal, PageHeader, Pill, Row, Table, Tabs } from '../../../components/ui';
import { errorMessage, fmtDateTime } from '../../../utils/format';
import useAuth from '../../../hooks/useAuth';
import useLoader from '../../../hooks/useLoader';
import { PUB_STATUS, confidenceTone, confirmBody, publicationsApi } from '../../../services/publications';
import { brDate } from '../../../services/rules';

// Caixa de publicações do DJEN (CAD-173): captura pela OAB, triagem sugerida, confirmação humana vira prazo/tarefa
function Oabs({ canManage, onChecked }) {
    const { data, error, reload } = useLoader(() => publicationsApi.oabs(), []);
    const [form, setForm] = useState({ numero: '', uf: '', nome: '' });
    const [busy, setBusy] = useState(null);
    const add = async (e) => {
        e.preventDefault();
        try { await publicationsApi.addOab(form); toast.success('OAB adicionada. A 1ª consulta busca os últimos 7 dias.'); setForm({ numero: '', uf: '', nome: '' }); reload(); }
        catch (err) { toast.error(errorMessage(err)); }
    };
    const check = async (w) => {
        setBusy(w.id);
        try {
            const r = await publicationsApi.checkOab(w.id);
            if (r.error) toast.error(r.error); else toast.success(`${r.new} publicação(ões) nova(s).`);
            reload(); onChecked();
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(null); }
    };
    return (
        <div className={styles.card}>
            <div className={styles.card_title}>OABs acompanhadas no DJEN</div>
            {error && <Banner tone="error">{error}</Banner>}
            {data && data.length === 0 && <Empty title="Comece pela OAB">Nenhuma OAB cadastrada ainda. {canManage ? 'Cadastre a OAB de cada advogado do escritório.' : 'Peça ao administrador para cadastrar.'}</Empty>}
            {data && data.map((w) => (
                <div key={w.id} className={styles.list_row}>
                    <div>
                        <strong>OAB {w.numero}/{w.uf}</strong> {w.nome && <span className={styles.muted}>· {w.nome}</span>}{' '}
                        <Pill tone={w.ativa ? 'green' : 'gray'}>{w.ativa ? 'ativa' : 'pausada'}</Pill>
                        <div className={styles.muted}>{w.ultima_consulta ? `consultada ${fmtDateTime(w.ultima_consulta)}` : 'ainda não consultada'}
                            {w.responsavel && ` · prazos para ${w.responsavel.nome}`}{w.erro && ` · ${w.erro}`}</div>
                    </div>
                    <Row>
                        <Button size="sm" loading={busy === w.id} loadingLabel="Consultando…" onClick={() => check(w)}>Consultar agora</Button>
                        {canManage && <Button size="sm" onClick={() => publicationsApi.updateOab(w.id, { ativa: !w.ativa }).then(reload)}>{w.ativa ? 'Pausar' : 'Retomar'}</Button>}
                        {canManage && <Button size="sm" variant="danger"
                            onClick={() => window.confirm(`Parar de acompanhar a OAB ${w.numero}/${w.uf}? As publicações já capturadas ficam na caixa.`) && publicationsApi.removeOab(w.id).then(reload)}>Remover</Button>}
                    </Row>
                </div>
            ))}
            {canManage && (
                <FilterBar as="form" className={styles.form_divider} onSubmit={add}>
                    <Field label="Nº da OAB"><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} inputMode="numeric" required /></Field>
                    <Field label="UF"><Input value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} maxLength={2} required /></Field>
                    <Field label="Nome do advogado (opcional)" className={styles.flex_2}><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
                    <Button type="submit">Adicionar OAB</Button>
                </FilterBar>
            )}
        </div>
    );
}

function Revisao({ id, onClose, onDone, canWrite }) {
    const [pub, setPub] = useState(null);
    const [form, setForm] = useState({ prazo_dias: '', vencimento: '', acompanhar: false, observacao: '' });
    const [preview, setPreview] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        publicationsApi.get(id).then((p) => {
            setPub(p);
            setForm((f) => ({ ...f, prazo_dias: p.triagem?.prazo_dias ?? '' }));
        }).catch((err) => toast.error(errorMessage(err)));
    }, [id]);
    useEffect(() => {
        const dias = Number(form.prazo_dias);
        if (!pub || !dias || dias === pub.triagem?.prazo_dias) { setPreview(null); return undefined; }
        const t = setTimeout(() => publicationsApi.prazo(id, dias).then(setPreview).catch(() => setPreview(null)), 300);
        return () => clearTimeout(t);
    }, [form.prazo_dias, pub, id]);
    if (!pub) return null;
    const t = pub.triagem || {};
    const [tone, conf] = confidenceTone(t.confianca || 0);
    const act = async (fn, msg) => {
        setBusy(true);
        try { await fn(); toast.success(msg); onDone(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const venc = form.vencimento || preview?.vencimento || pub.vencimento;
    // Com campos para confirmar, clique fora não fecha (não perde o que foi ajustado)
    const editavel = pub.status === 'nova' && canWrite;
    return (
        <Modal size="xl" onClose={onClose} busy={busy} closeOnOverlay={!editavel}
            title={<>{t.ato || pub.tipo} · {pub.tribunal} · <span className={styles.mono}>{pub.cnj || 'sem nº'}</span></>}
            footer={<>
                {editavel && <>
                    <Button variant="primary" loading={busy}
                        onClick={() => act(() => publicationsApi.confirm(id, confirmBody(form, t)), venc ? `Confirmada: prazo em ${brDate(venc)} na agenda.` : 'Confirmada.')}>
                        {venc ? `Confirmar e criar prazo (${brDate(venc)})` : 'Confirmar sem prazo'}</Button>
                    <Button disabled={busy}
                        onClick={() => { const m = window.prompt('Motivo do descarte (opcional):', ''); if (m !== null) act(() => publicationsApi.discard(id, m), 'Descartada.'); }}>Descartar</Button>
                </>}
                {pub.status !== 'nova' && canWrite && <Button disabled={busy} onClick={() => act(() => publicationsApi.reopen(id), 'Reaberta.')}>Reabrir</Button>}
                {canWrite && <Button as={Link} to={`/minutas?fonte=publicacao&id=${id}`}>Gerar minuta</Button>}
                <Button onClick={onClose} disabled={busy}>Fechar</Button>
            </>}>
            <div className={styles.muted}>{pub.orgao} · {pub.classe} · disponibilizada {brDate(pub.disponibilizada_em)}, publicada {brDate(pub.publicada_em)}
                {pub.processo?.cliente && ` · cliente: ${pub.processo.cliente}`}</div>
            <div className={styles.card}>
                <div><strong>Triagem sugerida</strong> <Pill tone={tone}>confiança {conf}</Pill> <span className={styles.muted}>({t.origem === 'local' ? 'leitura local' : `IA ${t.origem}`})</span></div>
                <div>Providência: {t.providencia}</div>
                <div>Prazo: {t.prazo_dias ? `${t.prazo_dias} dias úteis` : 'sem prazo identificado'} {t.prazo_origem && <span className={styles.muted}>— {t.prazo_origem}</span>}
                    {t.fatal && <> <Pill tone="red">possivelmente fatal</Pill></>}</div>
                {t.audiencia && <div>Audiência: <strong>{t.audiencia}</strong></div>}
            </div>
            <div className={`${styles.doc_text} ${styles.pre_wrap}`}>{pub.texto}</div>
            {pub.link && <a href={pub.link} target="_blank" rel="noreferrer noopener">Ver no DJEN</a>}
            {editavel && (
                <>
                    <div className={styles.section_title}>Confirmar</div>
                    <FilterBar>
                        <Field label="Prazo (dias úteis)"><Input type="number" min={1} max={365} value={form.prazo_dias} onChange={(e) => setForm({ ...form, prazo_dias: e.target.value, vencimento: '' })} /></Field>
                        <Field label="Vencimento (ou ajuste manual)"><Input type="date" value={form.vencimento || venc || ''} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></Field>
                        <Checkbox checked={form.acompanhar} onChange={(e) => setForm({ ...form, acompanhar: e.target.checked })} disabled={!!pub.processo}>
                            {pub.processo ? 'Processo já acompanhado' : 'Acompanhar este processo'}</Checkbox>
                    </FilterBar>
                    <p className={styles.muted}>Vencimento calculado em dias úteis a partir da publicação (feriados, recesso e o calendário do escritório). Confira antes de confirmar.</p>
                    <Field label="Observação (opcional)"><Input value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} maxLength={255} /></Field>
                </>
            )}
            {pub.status !== 'nova' && <Banner tone="info">{pub.status === 'confirmada' ? `Confirmada por ${pub.revisada_por}; prazo em ${brDate(pub.vencimento)}.` : `Descartada por ${pub.revisada_por}${pub.observacao ? ` (${pub.observacao})` : ''}.`}</Banner>}
        </Modal>
    );
}

export default function Publicacoes() {
    const { role, isOrgManager } = useAuth();
    const canWrite = role !== 'VIEWER';
    const [status, setStatus] = useState('nova');
    const [page, setPage] = useState(1);
    const [open, setOpen] = useState(null);
    const { data, error, reload } = useLoader(() => publicationsApi.list({ status, pagina: page }), [status, page]);
    const tabs = PUB_STATUS.map(([k, label]) => ({ id: k, label, count: data?.contagem?.[k] }));
    return (
        <div className={styles.page}>
            <PageHeader title="Publicações" subtitle="Intimações do DJEN pela OAB" />
            <Oabs canManage={isOrgManager} onChecked={reload} />
            <Tabs tabs={tabs} value={status} onChange={(k) => { setStatus(k); setPage(1); }} />
            {error && <Banner tone="error">{error}</Banner>}
            {!error && (
                <Table columns={['Disponibilizada', 'Processo', 'Triagem', 'Vencimento sugerido']} loading={!data}
                    empty={data?.resultados.length === 0 && <Empty>{status === 'nova' ? 'Nenhuma publicação nova. As OABs são consultadas a cada 3 horas.' : 'Nada aqui.'}</Empty>}>
                    {data?.resultados.map((p) => {
                        const t = p.triagem || {};
                        const [tone, conf] = confidenceTone(t.confianca || 0);
                        return (
                            <tr key={p.id} className={styles.clickable} tabIndex={0} onClick={() => setOpen(p.id)} onKeyDown={(e) => e.key === 'Enter' && setOpen(p.id)}>
                                <td>{brDate(p.disponibilizada_em)}<div className={styles.muted}>{p.oab}</div></td>
                                <td data-label="Processo"><span className={styles.mono}>{p.cnj || '—'}</span> <Pill tone="blue">{p.tribunal}</Pill><div className={styles.muted}>{p.orgao}</div>
                                    {p.processo?.cliente && <div className={styles.muted}>cliente: {p.processo.cliente}</div>}</td>
                                <td data-label="Triagem"><strong>{t.ato || p.tipo}</strong> {t.fatal && <Pill tone="red">fatal?</Pill>}<div className={styles.muted}>{t.providencia}</div></td>
                                <td data-label="Vencimento">{p.vencimento ? <strong>{brDate(p.vencimento)}</strong> : '—'}{t.prazo_dias && <div className={styles.muted}>{t.prazo_dias} dias úteis</div>}
                                    <Pill tone={tone}>{conf}</Pill></td>
                            </tr>
                        );
                    })}
                </Table>
            )}
            {data && data.total > 50 && (
                <Row>
                    <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                    <span className={styles.muted}>Página {page} de {Math.ceil(data.total / 50)}</span>
                    <Button disabled={page * 50 >= data.total} onClick={() => setPage(page + 1)}>Próxima</Button>
                </Row>
            )}
            <p className={styles.muted}>A triagem é sugestão (leitura local ou IA, conforme a política do escritório). O prazo só entra na agenda depois que alguém confirma.</p>
            {open && <Revisao id={open} canWrite={canWrite} onClose={() => setOpen(null)} onDone={() => { setOpen(null); reload(); }} />}
        </div>
    );
}
