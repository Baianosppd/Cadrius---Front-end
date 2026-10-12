import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Empty, Field, FilterBar, FormModal, Input, Loading, PageHeader, Pill, Row, Select, Stack, Tabs, Textarea } from '../../../components/ui';
import { errorMessage, fmtDateTime } from '../../../utils/format';
import useAuth from '../../../hooks/useAuth';
import api from '../../../services/api';
import useLoader from '../../../hooks/useLoader';
import { countPending, docxName, downloadBlob, minutasApi, nextPending } from '../../../services/publications';
import AIWriteMenu from '../../../components/assistant/AIWriteMenu';
import ModelosTab from '../../../components/minutas/ModelosTab';

// Minutas sobre documentos e publicações (CAD-173): sempre rascunho, com os trechos da fonte que foram usados
function NovaMinuta({ templates, initial, onCreated, onCancel }) {
    const [form, setForm] = useState({ modelo: initial.modelo || templates[0]?.chave || '', fonte: initial.fonte || '', fonte_id: initial.id || '', usar_ia: false });
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
        <FormModal title="Nova minuta" size="lg" onClose={onCancel} onSubmit={submit} busy={busy} submitLabel="Gerar rascunho" busyLabel="Gerando…">
            <Field label="Modelo">
                <Select value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} required>
                    {templates.map((t) => <option key={t.chave} value={t.chave}>{t.nome}{t.do_escritorio ? ' (do escritório)' : ''}</option>)}
                </Select>
            </Field>
            <FilterBar>
                <Field label="Sobre">
                    <Select value={form.fonte} onChange={(e) => setForm({ ...form, fonte: e.target.value, fonte_id: '' })}>
                        <option value="">Nada (só o modelo)</option><option value="publicacao">Uma publicação</option><option value="documento">Um documento</option>
                    </Select>
                </Field>
                {form.fonte === 'documento' && (
                    <Field label="Documento" className={styles.flex_2}>
                        <Select value={form.fonte_id} onChange={(e) => setForm({ ...form, fonte_id: e.target.value })} required>
                            <option value="">Escolha…</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                        </Select>
                    </Field>
                )}
                {form.fonte === 'publicacao' && (
                    <Field label="Nº da publicação"><Input value={form.fonte_id} onChange={(e) => setForm({ ...form, fonte_id: e.target.value })} required /></Field>
                )}
            </FilterBar>
            <Checkbox checked={form.usar_ia} onChange={(e) => setForm({ ...form, usar_ia: e.target.checked })} disabled={!form.fonte}>Melhorar com IA</Checkbox>
        </FormModal>
    );
}

function Editor({ id, canWrite, canManage, onChange }) {
    const [d, setD] = useState(null);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const ref = useRef(null);
    useEffect(() => { minutasApi.get(id).then((x) => { setD(x); setText(x.conteudo); }).catch((err) => toast.error(errorMessage(err))); }, [id]);
    if (!d) return <Loading />;
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
        <Stack>
            <div className={styles.header_row}>
                <div>
                    <strong>{d.titulo}</strong> <Pill tone={d.status === 'revisada' ? 'green' : 'yellow'}>{d.status}</Pill> {d.ia && <Pill tone="blue">IA {d.ia}</Pill>}
                    <div className={styles.muted}>por {d.autor} · {fmtDateTime(d.atualizada_em)}{d.revisada_por && ` · revisada por ${d.revisada_por}`}</div>
                </div>
                <Row>
                    {pending > 0 && <Button onClick={jump}>Próxima pendência ({pending})</Button>}
                    <Button onClick={download} disabled={dirty} title={dirty ? 'Salve antes de baixar' : undefined}>Baixar .docx</Button>
                    {canManage && <Button title="Guardar este texto como modelo do escritório para reusar"
                        onClick={() => minutasApi.addTemplate({ nome: d.titulo.slice(0, 120), corpo: text, tipo: 'outro' })
                            .then(() => { toast.success('Salvo em Modelos do escritório.'); onChange(); })
                            .catch((err) => toast.error(errorMessage(err)))}>Salvar como modelo</Button>}
                </Row>
            </div>
            {d.aviso && <Banner tone="warn">{d.aviso}</Banner>}
            <Textarea ref={ref} className={styles.doc_editor} value={text}
                onChange={(e) => setText(e.target.value)} readOnly={!canWrite} aria-label="Texto da minuta" />
            {canWrite && (
                <Row>
                    <Button disabled={busy || !dirty} onClick={() => save()}>Salvar</Button>
                    <AIWriteMenu value={text} onApply={setText} />
                    <Button variant="primary" disabled={busy || pending > 0 || (d.status === 'revisada' && !dirty)}
                        title={pending ? 'Complete os trechos [COMPLETAR] antes' : ''} onClick={() => save({ status: 'revisada' })}>Marcar como revisada</Button>
                    <Button variant="danger" onClick={() => window.confirm('Excluir esta minuta?') && minutasApi.remove(id).then(() => onChange(true))}>Excluir</Button>
                </Row>
            )}
            <div className={`${styles.section_title} ${styles.mb_0}`}>Trechos da fonte usados</div>
            {d.citacoes.length === 0 && <Empty>Minuta sem fonte.</Empty>}
            <Stack gap={2}>
                {d.citacoes.map((c, i) => (
                    <div key={i} className={styles.doc_text}>“{c.trecho}” <div className={styles.muted}>{c.origem} {c.conferido && '· conferido na fonte'}</div></div>
                ))}
            </Stack>
        </Stack>
    );
}

export default function Minutas() {
    const { role, isOrgManager } = useAuth();
    const canWrite = role !== 'VIEWER';
    const [params, setParams] = useSearchParams();
    const { data, error, reload } = useLoader(() => Promise.all([minutasApi.list(), minutasApi.templates()]), []);
    const [selected, setSelected] = useState(null);
    const fromQuery = params.get('fonte') ? { fonte: params.get('fonte'), id: params.get('id') } : (params.get('nova') ? {} : null);
    const [creating, setCreating] = useState(fromQuery);
    if (error) return <div className={styles.page}><Banner tone="error">{error}</Banner></div>;
    const [drafts, tpl] = data || [[], { modelos: [], variaveis: [] }];
    const tab = params.get('aba') === 'modelos' ? 'modelos' : 'minutas';
    const go = (k) => { const n = new URLSearchParams(params); n.set('aba', k); setParams(n, { replace: true }); };
    const tabs = [
        { id: 'minutas', label: 'Minutas', count: drafts.length || undefined },
        { id: 'modelos', label: 'Modelos', count: tpl.modelos.length || undefined },
    ];
    return (
        <div className={styles.page}>
            <PageHeader title="Minutas" subtitle="Rascunhos a partir dos seus modelos"
                actions={canWrite && <Button variant="primary" onClick={() => setCreating({})}>Nova minuta</Button>} />
            <Tabs tabs={tabs} value={tab} onChange={go} aria-label="Minutas" />
            {!data && <Loading />}
            {data && tab === 'modelos' && <ModelosTab templates={tpl.modelos} vars={tpl.variaveis || []} canManage={isOrgManager}
                onUse={(modelo) => setCreating({ modelo })} onChanged={reload} />}
            {tab === 'minutas' && <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Minuta é rascunho: confira fatos, datas e fundamentos. O que faltar aparece como [COMPLETAR: …].</p>}
            {tab === 'minutas' && <div className={`${styles.two_col} ${styles.align_start}`}>
                <Stack gap={2}>
                    {data && drafts.length === 0 && <Empty title="Nenhuma minuta ainda">Gere a primeira a partir de uma publicação, de um documento ou de um modelo do escritório.</Empty>}
                    {drafts.map((d) => (
                        <div key={d.id} className={`${styles.card} ${styles.clickable} ${selected === d.id ? styles.card_active : ''}`}
                            role="button" tabIndex={0} aria-pressed={selected === d.id}
                            onClick={() => setSelected(d.id)} onKeyDown={(e) => e.key === 'Enter' && setSelected(d.id)}>
                            <strong>{d.titulo}</strong>
                            <div className={styles.muted}>{fmtDateTime(d.atualizada_em)} · <Pill tone={d.status === 'revisada' ? 'green' : 'yellow'}>{d.status}</Pill>
                                {d.pendencias > 0 && <> <Pill tone="orange">{d.pendencias} a completar</Pill></>}</div>
                        </div>
                    ))}
                </Stack>
                <div>{selected ? <Editor key={selected} id={selected} canWrite={canWrite} canManage={isOrgManager} onChange={(gone) => { if (gone) setSelected(null); reload(); }} />
                    : data && <Empty>Escolha uma minuta à esquerda ou crie uma nova.</Empty>}</div>
            </div>}
            {creating && data && <NovaMinuta templates={tpl.modelos} initial={creating}
                onCancel={() => { setCreating(null); setParams({}); }}
                onCreated={(d) => { setCreating(null); setParams({}); setSelected(d.id); reload(); }} />}
        </div>
    );
}
