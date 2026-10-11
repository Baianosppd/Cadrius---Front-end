import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AssinaturaModal from '../../../components/integracoes/AssinaturaModal';
import { toast } from 'react-toastify';
import { FiDownload, FiPlus, FiRefreshCw, FiX } from 'react-icons/fi';
import styles from './DocumentDetail.module.css';
import ui from '../../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Field, Input, Row, Select, Stack, Textarea } from '../../../components/ui';
import BackButton from '../../../components/layout/BackButton';
import useAuth from '../../../hooks/useAuth';
import { errorMessage, fmtDate } from '../../../utils/format';
import {
    DOC_TYPES, EXTRACTION_STATUS, documentsApi, fieldsForConfirm, isBusy, normalizeFields,
} from '../../../services/documents';

// Tom do status da leitura → tom do Banner
const BANNER_TONE = { info: 'info', warn: 'warn', success: 'ok', danger: 'error' };

// Lista editável (partes, prazos, próximos passos): uma linha por item, com remover e adicionar
function ListEditor({ title, items, onChange, render, blank, addLabel, readOnly }) {
    return (
        <Stack as="section" gap={3} className={ui.card}>
            <h3 className={`${ui.section_title} ${ui.mb_0}`}>{title}</h3>
            {items.length === 0 && <p className={ui.muted}>Nada identificado.</p>}
            {items.map((item, i) => (
                <Row key={i} wrap={false}>
                    {render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}
                    {!readOnly && <Button size="sm" variant="ghost" icon={FiX} aria-label="Remover" onClick={() => onChange(items.filter((_, j) => j !== i))} />}
                </Row>
            ))}
            {!readOnly && <Button size="sm" icon={FiPlus} className={ui.w_fit} onClick={() => onChange([...items, blank])}>{addLabel}</Button>}
        </Stack>
    );
}

export default function DocumentDetail() {
    const { id } = useParams();
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
    const editable = canReview && ex?.status === 'review';
    const set = (patch) => setForm((f) => ({ ...f, ...patch }));

    return (
        <div className={ui.page}>
            <BackButton label="Voltar para Documentos" to="/documents" />
            <div className={styles.header}>
                <div className={styles.header_left}>
                    <h1 className={styles.title}>{doc?.nome || 'Documento'}</h1>
                    <div className={styles.meta}>
                        <span>{fmtDate(doc?.data)}</span>
                        <span className={styles.dot}>•</span><span>{doc?.tipo || '—'}</span>
                        {doc?.cliente && <><span className={styles.dot}>•</span><span>{doc.cliente}</span></>}
                    </div>
                </div>
                <Row>
                    {canReview && ex && ex.status !== 'confirmed' && !isBusy(ex.status) && (
                        <Button icon={FiRefreshCw} disabled={busy} onClick={reprocess}>Ler novamente</Button>
                    )}
                    <Button icon={FiDownload} onClick={download}>Baixar</Button>
                    <Button as={Link} to={`/assistente?documento=${id}&nome=${encodeURIComponent(doc?.nome || '')}`}>Usar no Assistente</Button>
                    <Button as={Link} to={`/minutas?fonte=documento&id=${id}`}>Gerar minuta</Button>
                    {doc?.nome?.toLowerCase().endsWith('.pdf') && <Button onClick={() => setSigning(true)}>Enviar para assinatura</Button>}
                </Row>
            </div>

            {status && (
                <Banner tone={BANNER_TONE[status.tone] || 'info'} role="status">
                    <strong>{status.label}</strong>{ex.message ? ` — ${ex.message}` : ''}
                    {ex.confidence != null && <> · confiança da IA {ex.confidence}%</>}
                    {ex.ocr_used && <> · lido por OCR (confira com atenção)</>}
                    {ex.status === 'review' && <div className={ui.mt_2}>Confira e confirme para criar as tarefas e prazos.</div>}
                    {ex.status === 'confirmed' && ex.reviewed_by && <div>Revisado por {ex.reviewed_by}.</div>}
                </Banner>
            )}

            {form && ex && ['review', 'confirmed'].includes(ex.status) && (
                <Stack>
                    <Stack as="section" className={ui.card}>
                        <h3 className={`${ui.section_title} ${ui.mb_0}`}>Resumo e identificação</h3>
                        <Field label="Tipo do documento">
                            <Select disabled={!editable} value={form.tipo_documento} onChange={(e) => set({ tipo_documento: e.target.value })}>
                                {DOC_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                            </Select>
                        </Field>
                        <Field label="Nº do processo"><Input disabled={!editable} value={form.numero_processo} onChange={(e) => set({ numero_processo: e.target.value })} /></Field>
                        <Field label="Valor"><Input disabled={!editable} value={form.valor} onChange={(e) => set({ valor: e.target.value })} /></Field>
                        <Field label="Resumo"><Textarea rows={4} disabled={!editable} value={form.resumo} onChange={(e) => set({ resumo: e.target.value })} /></Field>
                    </Stack>

                    <ListEditor title="Partes" items={form.partes} readOnly={!editable} blank={{ papel: '', nome: '' }} addLabel="Adicionar parte"
                        onChange={(partes) => set({ partes })}
                        render={(p, upd) => (<>
                            <Input className={ui.flex_1} placeholder="Papel" aria-label="Papel" disabled={!editable} value={p.papel} onChange={(e) => upd({ papel: e.target.value })} />
                            <Input className={ui.flex_2} placeholder="Nome" aria-label="Nome" disabled={!editable} value={p.nome} onChange={(e) => upd({ nome: e.target.value })} />
                        </>)} />

                    <ListEditor title="Prazos (com data viram tarefas ao confirmar)" items={form.prazos} readOnly={!editable}
                        blank={{ descricao: '', data: '', dias: null, fatal: false }} addLabel="Adicionar prazo" onChange={(prazos) => set({ prazos })}
                        render={(p, upd) => (<>
                            <Input className={ui.flex_2} placeholder="O que fazer" aria-label="O que fazer" disabled={!editable} value={p.descricao} onChange={(e) => upd({ descricao: e.target.value })} />
                            <Input className={ui.flex_1} type="date" aria-label="Data" disabled={!editable} value={p.data || ''} onChange={(e) => upd({ data: e.target.value })} />
                            <Checkbox disabled={!editable} checked={p.fatal} onChange={(e) => upd({ fatal: e.target.checked })}>Fatal</Checkbox>
                        </>)} />

                    <ListEditor title="Próximos passos sugeridos" items={form.proximos_passos.map((t) => ({ t }))} readOnly={!editable} blank={{ t: '' }} addLabel="Adicionar"
                        onChange={(rows) => set({ proximos_passos: rows.map((r) => r.t) })}
                        render={(r, upd) => <Input className={ui.flex_1} aria-label="Próximo passo" disabled={!editable} value={r.t} onChange={(e) => upd({ t: e.target.value })} />} />

                    {editable && <Button variant="primary" className={ui.w_fit} loading={busy} loadingLabel="Salvando…" onClick={confirm}>Confirmar leitura e criar tarefas</Button>}
                    {tasks.length > 0 && (
                        <Stack as="section" gap={3} className={ui.card}>
                            <h3 className={`${ui.section_title} ${ui.mb_0}`}>Tarefas criadas</h3>
                            <ul className={ui.mt_0}>{tasks.map((t) => <li key={t.id}>{t.titulo} — {new Date(t.scheduled_at).toLocaleString('pt-BR')}</li>)}</ul>
                            <Button as={Link} to="/dashboard" className={ui.w_fit}>Ver no Painel</Button>
                        </Stack>
                    )}
                </Stack>
            )}
            {!isOrgManager && ex?.status === 'review' && !canReview && <p className={ui.muted}>Seu papel permite apenas visualizar.</p>}
            {signing && <AssinaturaModal documentId={id} documentName={doc?.nome} onClose={() => setSigning(false)} />}
        </div>
    );
}
