import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AssinaturaModal from '../../components/integracoes/AssinaturaModal';
import { toast } from 'react-toastify';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import styles from './DocumentDetail.module.css';
import BackButton from '../../components/common/BackButton';
import useAuth from '../../hooks/useAuth';
import { errorMessage } from '../../components/seguranca/ui';
import {
    DOC_TYPES, EXTRACTION_STATUS, documentsApi, fieldsForConfirm, isBusy, normalizeFields,
} from '../../services/documents';

const TONES = {
    info: { background: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    warn: { background: '#fffbeb', color: '#92400e', border: '#fde68a' },
    success: { background: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
    danger: { background: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};
const box = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, marginBottom: 16 };
const input = { width: '100%', padding: 7, border: '1px solid #d1d5db', borderRadius: 6 };

function ListEditor({ title, items, onChange, render, blank, addLabel, readOnly }) {
    return (
        <section style={box}>
            <h3 style={{ marginTop: 0 }}>{title}</h3>
            {items.length === 0 && <p style={{ color: '#6b7280' }}>Nada identificado.</p>}
            {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    {render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}
                    {!readOnly && <button type="button" aria-label="Remover" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>}
                </div>
            ))}
            {!readOnly && <button type="button" onClick={() => onChange([...items, blank])}>{addLabel}</button>}
        </section>
    );
}

export default function DocumentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [signing, setSigning] = useState(false);
    const { isOrgManager, role } = useAuth();
    const canReview = role !== 'VIEWER';
    const [doc, setDoc] = useState(null);
    const [ex, setEx] = useState(null);
    const [form, setForm] = useState(null);
    const [busy, setBusy] = useState(false);
    const [tasks, setTasks] = useState([]);
    const timer = useRef(null);

    const loadExtraction = useCallback(async () => {
        try {
            const data = await documentsApi.extraction(id);
            setEx(data);
            setForm((f) => (f && data.status === 'review' ? f : normalizeFields(data.fields)));
            return data;
        } catch (err) { toast.error(errorMessage(err, 'Não foi possível carregar a leitura do documento.')); return null; }
    }, [id]);

    useEffect(() => {
        documentsApi.get(id).then(setDoc).catch((e) => toast.error(errorMessage(e, 'Documento não encontrado.')));
        loadExtraction();
        return () => clearTimeout(timer.current);
    }, [id, loadExtraction]);

    // Enquanto está na fila/lendo, consulta a cada 3 s (para quando termina ou depois de 2 min)
    useEffect(() => {
        if (!ex || !isBusy(ex.status)) return undefined;
        let tries = 0;
        const tick = async () => {
            const d = await loadExtraction();
            tries += 1;
            if (d && isBusy(d.status) && tries < 40) timer.current = setTimeout(tick, 3000);
        };
        timer.current = setTimeout(tick, 3000);
        return () => clearTimeout(timer.current);
    }, [ex?.status]); // eslint-disable-line react-hooks/exhaustive-deps

    const download = async () => {
        try {
            const blob = await documentsApi.download(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = doc?.nome || 'documento'; a.click();
            URL.revokeObjectURL(url);
        } catch (e) { toast.error(errorMessage(e, 'Não foi possível baixar o arquivo.')); }
    };
    const reprocess = async () => {
        setBusy(true);
        try { setEx(await documentsApi.reprocess(id)); setForm(null); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
    };
    const confirm = async () => {
        setBusy(true);
        try {
            const r = await documentsApi.confirm(id, fieldsForConfirm(form));
            setEx(r); setTasks(r.tasks_created || []); setForm(normalizeFields(r.fields));
            toast.success(r.tasks_created?.length ? `Confirmado. ${r.tasks_created.length} tarefa(s) criada(s).` : 'Confirmado.');
        } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
    };

    const status = ex ? EXTRACTION_STATUS[ex.status] : null;
    const tone = status ? TONES[status.tone] : TONES.info;
    const editable = canReview && ex?.status === 'review';
    const set = (patch) => setForm((f) => ({ ...f, ...patch }));

    return (
        <div className={styles.DocumentDetail_container}>
            <BackButton label="Voltar para Documentos" to="/documents" />
            <div className={styles.header}>
                <div className={styles.header_left}>
                    <h1 className={styles.title}>{doc?.nome || 'Documento'}</h1>
                    <div className={styles.meta}>
                        <span>{doc?.data ? new Date(doc.data).toLocaleDateString('pt-BR') : '—'}</span>
                        <span className={styles.dot}>•</span><span>{doc?.tipo || '—'}</span>
                        {doc?.cliente && <><span className={styles.dot}>•</span><span>{doc.cliente}</span></>}
                    </div>
                </div>
                <div className={styles.header_actions}>
                    {canReview && ex && ex.status !== 'confirmed' && !isBusy(ex.status) && (
                        <button className={styles.secondary_button} onClick={reprocess} disabled={busy}><FiRefreshCw className={styles.button_icon} /> Ler novamente</button>
                    )}
                    <button className={styles.secondary_button} onClick={download}><FiDownload className={styles.button_icon} /> Baixar</button>
                    <button className={styles.secondary_button} onClick={() => navigate(`/minutas?fonte=documento&id=${id}`)}>Gerar minuta</button>
                    {doc?.nome?.toLowerCase().endsWith('.pdf') && <button className={styles.secondary_button} onClick={() => setSigning(true)}>Enviar para assinatura</button>}
                </div>
            </div>

            {status && (
                <div role="status" style={{ ...box, background: tone.background, color: tone.color, borderColor: tone.border }}>
                    <strong>{status.label}</strong>{ex.message ? ` — ${ex.message}` : ''}
                    {ex.confidence != null && <> · confiança da IA {ex.confidence}%</>}
                    {ex.ocr_used && <> · lido por OCR (confira com atenção)</>}
                    {ex.status === 'review' && <div style={{ marginTop: 6 }}>A IA pode errar. Nada vira tarefa ou prazo até você confirmar.</div>}
                    {ex.status === 'confirmed' && ex.reviewed_by && <div>Revisado por {ex.reviewed_by}.</div>}
                </div>
            )}

            {form && ex && ['review', 'confirmed'].includes(ex.status) && (
                <div>
                    <section style={box}>
                        <h3 style={{ marginTop: 0 }}>Resumo e identificação</h3>
                        <label>Tipo do documento
                            <select style={input} disabled={!editable} value={form.tipo_documento} onChange={(e) => set({ tipo_documento: e.target.value })}>
                                {DOC_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                            </select>
                        </label>
                        <label>Nº do processo<input style={input} disabled={!editable} value={form.numero_processo} onChange={(e) => set({ numero_processo: e.target.value })} /></label>
                        <label>Valor<input style={input} disabled={!editable} value={form.valor} onChange={(e) => set({ valor: e.target.value })} /></label>
                        <label>Resumo<textarea style={input} rows={4} disabled={!editable} value={form.resumo} onChange={(e) => set({ resumo: e.target.value })} /></label>
                    </section>

                    <ListEditor title="Partes" items={form.partes} readOnly={!editable} blank={{ papel: '', nome: '' }} addLabel="+ Adicionar parte"
                        onChange={(partes) => set({ partes })}
                        render={(p, upd) => (<>
                            <input style={{ ...input, maxWidth: 160 }} placeholder="Papel" disabled={!editable} value={p.papel} onChange={(e) => upd({ papel: e.target.value })} />
                            <input style={input} placeholder="Nome" disabled={!editable} value={p.nome} onChange={(e) => upd({ nome: e.target.value })} />
                        </>)} />

                    <ListEditor title="Prazos (com data viram tarefas ao confirmar)" items={form.prazos} readOnly={!editable}
                        blank={{ descricao: '', data: '', dias: null, fatal: false }} addLabel="+ Adicionar prazo" onChange={(prazos) => set({ prazos })}
                        render={(p, upd) => (<>
                            <input style={input} placeholder="O que fazer" disabled={!editable} value={p.descricao} onChange={(e) => upd({ descricao: e.target.value })} />
                            <input style={{ ...input, maxWidth: 170 }} type="date" disabled={!editable} value={p.data || ''} onChange={(e) => upd({ data: e.target.value })} />
                            <label style={{ whiteSpace: 'nowrap' }}><input type="checkbox" disabled={!editable} checked={p.fatal} onChange={(e) => upd({ fatal: e.target.checked })} /> Fatal</label>
                        </>)} />

                    <ListEditor title="Próximos passos sugeridos" items={form.proximos_passos.map((t) => ({ t }))} readOnly={!editable} blank={{ t: '' }} addLabel="+ Adicionar"
                        onChange={(rows) => set({ proximos_passos: rows.map((r) => r.t) })}
                        render={(r, upd) => <input style={input} disabled={!editable} value={r.t} onChange={(e) => upd({ t: e.target.value })} />} />

                    {editable && <button type="button" onClick={confirm} disabled={busy} style={{ padding: '10px 18px' }}>{busy ? 'Salvando…' : 'Confirmar leitura e criar tarefas'}</button>}
                    {tasks.length > 0 && (
                        <section style={{ ...box, marginTop: 16 }}>
                            <h3 style={{ marginTop: 0 }}>Tarefas criadas</h3>
                            <ul>{tasks.map((t) => <li key={t.id}>{t.titulo} — {new Date(t.scheduled_at).toLocaleString('pt-BR')}</li>)}</ul>
                            <button type="button" onClick={() => navigate('/dashboard')}>Ver no dashboard</button>
                        </section>
                    )}
                </div>
            )}
            {!isOrgManager && ex?.status === 'review' && !canReview && <p style={{ color: '#6b7280' }}>Seu papel permite apenas visualizar.</p>}
            {signing && <AssinaturaModal documentId={id} documentName={doc?.nome} onClose={() => setSigning(false)} />}
        </div>
    );
}
