import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import useLoader from '../gestao/useLoader';
import { PUB_STATUS, confidenceTone, confirmBody, publicationsApi } from '../../services/publications';
import { brDate } from '../../services/rules';

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
            {data && data.length === 0 && <Empty>Nenhuma OAB cadastrada. {canManage ? 'Cadastre a OAB de cada advogado do escritório.' : 'Peça ao administrador para cadastrar.'}</Empty>}
            {data && data.map((w) => (
                <div key={w.id} className={styles.list_row}>
                    <div>
                        <strong>OAB {w.numero}/{w.uf}</strong> {w.nome && <span className={styles.muted}>· {w.nome}</span>}{' '}
                        <Pill tone={w.ativa ? 'green' : 'gray'}>{w.ativa ? 'ativa' : 'pausada'}</Pill>
                        <div className={styles.muted}>{w.ultima_consulta ? `consultada ${fmtDateTime(w.ultima_consulta)}` : 'ainda não consultada'}
                            {w.responsavel && ` · prazos para ${w.responsavel.nome}`}{w.erro && ` · ${w.erro}`}</div>
                    </div>
                    <div className={styles.btn_row}>
                        <button type="button" className={`${styles.btn} ${styles.btn_sm}`} disabled={busy === w.id} onClick={() => check(w)}>{busy === w.id ? 'Consultando…' : 'Consultar agora'}</button>
                        {canManage && <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => publicationsApi.updateOab(w.id, { ativa: !w.ativa }).then(reload)}>{w.ativa ? 'Pausar' : 'Retomar'}</button>}
                        {canManage && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_danger}`}
                            onClick={() => window.confirm(`Parar de acompanhar a OAB ${w.numero}/${w.uf}? As publicações já capturadas ficam na caixa.`) && publicationsApi.removeOab(w.id).then(reload)}>Remover</button>}
                    </div>
                </div>
            ))}
            {canManage && (
                <form className={`${styles.filters} ${styles.form_divider}`} onSubmit={add}>
                    <label className={styles.field}>Nº da OAB<input className={styles.input} value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} inputMode="numeric" required /></label>
                    <label className={styles.field}>UF<input className={styles.input} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} maxLength={2} required /></label>
                    <label className={styles.field} style={{ flex: 2 }}>Nome do advogado (opcional)<input className={styles.input} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
                    <button type="submit" className={styles.btn}>Adicionar OAB</button>
                </form>
            )}
        </div>
    );
}

function Revisao({ id, onClose, onDone, canWrite }) {
    const navigate = useNavigate();
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
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.modal} style={{ maxWidth: 860, maxHeight: '92vh', overflowY: 'auto' }}>
                <div className={styles.modal_title}>{t.ato || pub.tipo} · {pub.tribunal} · <span className={styles.mono}>{pub.cnj || 'sem nº'}</span></div>
                <div className={styles.muted}>{pub.orgao} · {pub.classe} · disponibilizada {brDate(pub.disponibilizada_em)}, publicada {brDate(pub.publicada_em)}
                    {pub.processo?.cliente && ` · cliente: ${pub.processo.cliente}`}</div>
                <div className={styles.card} style={{ margin: '10px 0' }}>
                    <div><strong>Triagem sugerida</strong> <Pill tone={tone}>confiança {conf}</Pill> <span className={styles.muted}>({t.origem === 'local' ? 'leitura local' : `IA ${t.origem}`})</span></div>
                    <div>Providência: {t.providencia}</div>
                    <div>Prazo: {t.prazo_dias ? `${t.prazo_dias} dias úteis` : 'sem prazo identificado'} {t.prazo_origem && <span className={styles.muted}>— {t.prazo_origem}</span>}
                        {t.fatal && <> <Pill tone="red">possivelmente fatal</Pill></>}</div>
                    {t.audiencia && <div>Audiência: <strong>{t.audiencia}</strong></div>}
                </div>
                <div className={styles.doc_text} style={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflowY: 'auto' }}>{pub.texto}</div>
                {pub.link && <a href={pub.link} target="_blank" rel="noreferrer noopener">Ver no DJEN</a>}
                {pub.status === 'nova' && canWrite && (
                    <>
                        <div className={styles.section_title}>Confirmar</div>
                        <div className={styles.filters}>
                            <label className={styles.field}>Prazo (dias úteis)<input className={styles.input} type="number" min={1} max={365} value={form.prazo_dias} onChange={(e) => setForm({ ...form, prazo_dias: e.target.value, vencimento: '' })} /></label>
                            <label className={styles.field}>Vencimento (ou ajuste manual)<input className={styles.input} type="date" value={form.vencimento || venc || ''} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></label>
                            <label className={styles.check_row}><input type="checkbox" checked={form.acompanhar} onChange={(e) => setForm({ ...form, acompanhar: e.target.checked })} disabled={!!pub.processo} /> {pub.processo ? 'Processo já acompanhado' : 'Acompanhar este processo'}</label>
                        </div>
                        <p className={styles.muted}>Vencimento calculado em dias úteis a partir da publicação (feriados, recesso e o calendário do escritório). Confira antes de confirmar.</p>
                        <label className={styles.field}>Observação (opcional)<input className={styles.input} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} maxLength={255} /></label>
                    </>
                )}
                {pub.status !== 'nova' && <Banner tone="info">{pub.status === 'confirmada' ? `Confirmada por ${pub.revisada_por}; prazo em ${brDate(pub.vencimento)}.` : `Descartada por ${pub.revisada_por}${pub.observacao ? ` (${pub.observacao})` : ''}.`}</Banner>}
                <div className={styles.btn_row}>
                    {pub.status === 'nova' && canWrite && <>
                        <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}
                            onClick={() => act(() => publicationsApi.confirm(id, confirmBody(form, t)), venc ? `Confirmada: prazo em ${brDate(venc)} na agenda.` : 'Confirmada.')}>
                            {venc ? `Confirmar e criar prazo (${brDate(venc)})` : 'Confirmar sem prazo'}</button>
                        <button type="button" className={styles.btn} disabled={busy}
                            onClick={() => { const m = window.prompt('Motivo do descarte (opcional):', ''); if (m !== null) act(() => publicationsApi.discard(id, m), 'Descartada.'); }}>Descartar</button>
                    </>}
                    {pub.status !== 'nova' && canWrite && <button type="button" className={styles.btn} onClick={() => act(() => publicationsApi.reopen(id), 'Reaberta.')}>Reabrir</button>}
                    {canWrite && <button type="button" className={styles.btn} onClick={() => navigate(`/minutas?fonte=publicacao&id=${id}`)}>Gerar minuta</button>}
                    <button type="button" className={styles.btn} onClick={onClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
}

export default function Publicacoes() {
    const { role, isOrgManager } = useAuth();
    const canWrite = role !== 'VIEWER';
    const [status, setStatus] = useState('nova');
    const [page, setPage] = useState(1);
    const [open, setOpen] = useState(null);
    const { data, error, reload } = useLoader(() => publicationsApi.list({ status, pagina: page }), [status, page]);
    return (
        <div className={styles.page}>
            <PageHeader title="Publicações" subtitle="Intimações do Diário de Justiça Eletrônico Nacional (DJEN) pela OAB, com triagem sugerida" />
            <Oabs canManage={isOrgManager} onChecked={reload} />
            <div className={styles.tabs} role="tablist">
                {PUB_STATUS.map(([k, label]) => (
                    <button key={k} type="button" role="tab" aria-selected={status === k} className={`${styles.tab} ${status === k ? styles.tab_active : ''}`}
                        onClick={() => { setStatus(k); setPage(1); }}>{label}{data?.contagem && <span className={styles.count}>{data.contagem[k]}</span>}</button>
                ))}
            </div>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Carregando…</Empty>}
            {data && data.resultados.length === 0 && <Empty>{status === 'nova' ? 'Nenhuma publicação nova. As OABs são consultadas a cada 3 horas.' : 'Nada aqui.'}</Empty>}
            {data && data.resultados.length > 0 && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Disponibilizada</th><th>Processo</th><th>Triagem</th><th>Vencimento sugerido</th></tr></thead>
                        <tbody>
                            {data.resultados.map((p) => {
                                const t = p.triagem || {};
                                const [tone, conf] = confidenceTone(t.confianca || 0);
                                return (
                                    <tr key={p.id} onClick={() => setOpen(p.id)} style={{ cursor: 'pointer' }}>
                                        <td>{brDate(p.disponibilizada_em)}<div className={styles.muted}>{p.oab}</div></td>
                                        <td><span className={styles.mono}>{p.cnj || '—'}</span> <Pill tone="blue">{p.tribunal}</Pill><div className={styles.muted}>{p.orgao}</div>
                                            {p.processo?.cliente && <div className={styles.muted}>cliente: {p.processo.cliente}</div>}</td>
                                        <td><strong>{t.ato || p.tipo}</strong> {t.fatal && <Pill tone="red">fatal?</Pill>}<div className={styles.muted}>{t.providencia}</div></td>
                                        <td>{p.vencimento ? <strong>{brDate(p.vencimento)}</strong> : '—'}{t.prazo_dias && <div className={styles.muted}>{t.prazo_dias} dias úteis</div>}
                                            <Pill tone={tone}>{conf}</Pill></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {data && data.total > 50 && (
                <div className={styles.btn_row}>
                    <button type="button" className={styles.btn} disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
                    <span className={styles.muted}>Página {page} de {Math.ceil(data.total / 50)}</span>
                    <button type="button" className={styles.btn} disabled={page * 50 >= data.total} onClick={() => setPage(page + 1)}>Próxima</button>
                </div>
            )}
            <p className={styles.muted}>A triagem é sugestão (leitura local ou IA, conforme a política do escritório). O prazo só entra na agenda depois que alguém confirma.</p>
            {open && <Revisao id={open} canWrite={canWrite} onClose={() => setOpen(null)} onDone={() => { setOpen(null); reload(); }} />}
        </div>
    );
}
