import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import useLoader from '../gestao/useLoader';
import { countPending, docxName, downloadBlob, minutasApi, nextPending } from '../../services/publications';

// Minutas sobre documentos e publicações (CAD-173): sempre rascunho, com os trechos da fonte que foram usados
function NovaMinuta({ templates, initial, onCreated, onCancel }) {
    const [form, setForm] = useState({ modelo: templates[0]?.chave || '', fonte: initial.fonte || '', fonte_id: initial.id || '', usar_ia: false });
    const [docs, setDocs] = useState([]);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (form.fonte === 'documento') api.get('documentos/', { params: { page: 1 } }).then((r) => setDocs(r.data.results ?? r.data)).catch(() => setDocs([]));
    }, [form.fonte]);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const d = await minutasApi.generate({ ...form, fonte_id: form.fonte ? Number(form.fonte_id) : null });
            toast.success(d.ia ? 'Minuta gerada com IA: revise todo o texto.' : 'Minuta gerada a partir do modelo.');
            if (d.aviso) toast.info(d.aviso);
            onCreated(d);
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <form className={styles.modal} onSubmit={submit}>
                <div className={styles.modal_title}>Nova minuta</div>
                <label className={styles.field}>Modelo
                    <select className={styles.select} value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })}>
                        {templates.map((t) => <option key={t.chave} value={t.chave}>{t.nome}{t.do_escritorio ? ' (do escritório)' : ''}</option>)}
                    </select>
                </label>
                <div className={styles.filters}>
                    <label className={styles.field}>Sobre
                        <select className={styles.select} value={form.fonte} onChange={(e) => setForm({ ...form, fonte: e.target.value, fonte_id: '' })}>
                            <option value="">Nada (só o modelo)</option><option value="publicacao">Uma publicação</option><option value="documento">Um documento</option>
                        </select>
                    </label>
                    {form.fonte === 'documento' && (
                        <label className={styles.field} style={{ flex: 2 }}>Documento
                            <select className={styles.select} value={form.fonte_id} onChange={(e) => setForm({ ...form, fonte_id: e.target.value })} required>
                                <option value="">Escolha…</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                            </select>
                        </label>
                    )}
                    {form.fonte === 'publicacao' && (
                        <label className={styles.field}>Nº da publicação<input className={styles.input} value={form.fonte_id} onChange={(e) => setForm({ ...form, fonte_id: e.target.value })} required /></label>
                    )}
                </div>
                <label className={styles.check_row}><input type="checkbox" checked={form.usar_ia} onChange={(e) => setForm({ ...form, usar_ia: e.target.checked })} disabled={!form.fonte} />
                    Melhorar com IA (usa créditos; o texto da fonte vai mascarado e só ficam citações que existem na fonte)</label>
                <div className={styles.btn_row}>
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || !form.modelo}>{busy ? 'Gerando…' : 'Gerar rascunho'}</button>
                    <button type="button" className={styles.btn} onClick={onCancel}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}

function Editor({ id, canWrite, onChange }) {
    const [d, setD] = useState(null);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const ref = useRef(null);
    useEffect(() => { minutasApi.get(id).then((x) => { setD(x); setText(x.conteudo); }).catch((err) => toast.error(errorMessage(err))); }, [id]);
    if (!d) return <Empty>Carregando…</Empty>;
    const pending = countPending(text);
    const dirty = text !== d.conteudo;
    const save = async (extra = {}) => {
        setBusy(true);
        try {
            const x = await minutasApi.update(id, { conteudo: text, ...extra });
            setD(x); setText(x.conteudo); toast.success(x.status === 'revisada' ? 'Minuta marcada como revisada.' : 'Salvo.'); onChange();
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const jump = () => {
        const el = ref.current;
        const r = nextPending(text, el?.selectionEnd || 0);
        if (r && el) { el.focus(); el.setSelectionRange(r[0], r[1]); }
    };
    const download = async () => {
        try { downloadBlob(await minutasApi.docx(id), docxName(d.titulo)); }
        catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <div>
            <div className={styles.header_row}>
                <div>
                    <strong>{d.titulo}</strong> <Pill tone={d.status === 'revisada' ? 'green' : 'yellow'}>{d.status}</Pill> {d.ia && <Pill tone="blue">IA {d.ia}</Pill>}
                    <div className={styles.muted}>por {d.autor} · {fmtDateTime(d.atualizada_em)}{d.revisada_por && ` · revisada por ${d.revisada_por}`}</div>
                </div>
                <div className={styles.btn_row}>
                    {pending > 0 && <button type="button" className={styles.btn} onClick={jump}>Próxima pendência ({pending})</button>}
                    <button type="button" className={styles.btn} onClick={download} disabled={dirty}>Baixar .docx</button>
                </div>
            </div>
            {d.aviso && <Banner tone="warn">{d.aviso}</Banner>}
            <textarea ref={ref} className={styles.textarea} style={{ minHeight: 420, width: '100%', boxSizing: 'border-box', fontFamily: 'Georgia, serif', fontSize: 15 }} value={text}
                onChange={(e) => setText(e.target.value)} readOnly={!canWrite} aria-label="Texto da minuta" />
            {canWrite && (
                <div className={styles.btn_row}>
                    <button type="button" className={styles.btn} disabled={busy || !dirty} onClick={() => save()}>Salvar</button>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || pending > 0 || d.status === 'revisada' && !dirty}
                        title={pending ? 'Complete os trechos [COMPLETAR] antes' : ''} onClick={() => save({ status: 'revisada' })}>Marcar como revisada</button>
                    <button type="button" className={`${styles.btn} ${styles.btn_danger}`} onClick={() => window.confirm('Excluir esta minuta?') && minutasApi.remove(id).then(() => onChange(true))}>Excluir</button>
                </div>
            )}
            <div className={styles.section_title}>Trechos da fonte usados</div>
            {d.citacoes.length === 0 && <Empty>Minuta sem fonte.</Empty>}
            {d.citacoes.map((c, i) => (
                <div key={i} className={styles.doc_text} style={{ marginBottom: 6 }}>“{c.trecho}” <div className={styles.muted}>{c.origem} {c.conferido && '· conferido na fonte'}</div></div>
            ))}
        </div>
    );
}

export default function Minutas() {
    const { role } = useAuth();
    const canWrite = role !== 'VIEWER';
    const [params, setParams] = useSearchParams();
    const { data, error, reload } = useLoader(() => Promise.all([minutasApi.list(), minutasApi.templates()]), []);
    const [selected, setSelected] = useState(null);
    const fromQuery = params.get('fonte') ? { fonte: params.get('fonte'), id: params.get('id') } : null;
    const [creating, setCreating] = useState(fromQuery);
    if (error) return <div className={styles.page}><Banner tone="error">{error}</Banner></div>;
    const [drafts, tpl] = data || [[], { modelos: [] }];
    return (
        <div className={styles.page}>
            <PageHeader title="Minutas" subtitle="Rascunhos sobre publicações e documentos, a partir dos modelos do Cadrius ou do escritório"
                actions={canWrite && <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setCreating({})}>Nova minuta</button>} />
            <Banner tone="info">Minuta é rascunho: confira fatos, datas e fundamentos. Campos sem informação aparecem como [COMPLETAR: …].</Banner>
            {!data && <Empty>Carregando…</Empty>}
            <div className={styles.two_col}>
                <div>
                    {data && drafts.length === 0 && <Empty>Nenhuma minuta ainda.</Empty>}
                    {drafts.map((d) => (
                        <div key={d.id} className={styles.card} style={{ marginBottom: 6, cursor: 'pointer', borderColor: selected === d.id ? '#2563eb' : undefined }}
                            onClick={() => setSelected(d.id)}>
                            <strong>{d.titulo}</strong>
                            <div className={styles.muted}>{fmtDateTime(d.atualizada_em)} · <Pill tone={d.status === 'revisada' ? 'green' : 'yellow'}>{d.status}</Pill>
                                {d.pendencias > 0 && <> <Pill tone="orange">{d.pendencias} a completar</Pill></>}</div>
                        </div>
                    ))}
                </div>
                <div>{selected ? <Editor key={selected} id={selected} canWrite={canWrite} onChange={(gone) => { if (gone) setSelected(null); reload(); }} />
                    : data && <Empty>Escolha uma minuta à esquerda ou crie uma nova.</Empty>}</div>
            </div>
            {creating && data && <NovaMinuta templates={tpl.modelos} initial={creating}
                onCancel={() => { setCreating(null); setParams({}); }}
                onCreated={(d) => { setCreating(null); setParams({}); setSelected(d.id); reload(); }} />}
        </div>
    );
}
