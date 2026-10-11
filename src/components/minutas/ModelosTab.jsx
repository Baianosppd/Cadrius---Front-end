import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiUpload, FiPlus, FiFileText } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import { Banner, Button, Empty, Field, FilterBar, FormModal, Input, Pill, Row, Select, Stack, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
import { TEMPLATE_KINDS, fieldLabel, minutasApi, templateFields } from '../../services/publications';

const kindLabel = (k) => TEMPLATE_KINDS.find(([id]) => id === k)?.[1] || 'Outro';

// Editor de modelo (novo, importado ou existente): nome, tipo, texto e os campos que o texto usa
function ModeloForm({ initial, vars, onSaved, onCancel }) {
    const [form, setForm] = useState({ nome: initial.nome || '', tipo: initial.tipo || 'outro', corpo: initial.corpo || '' });
    const [busy, setBusy] = useState(false);
    const ref = useRef(null);
    const fields = templateFields(form.corpo);
    const insert = (key) => {
        const el = ref.current;
        const at = el?.selectionStart ?? form.corpo.length;
        setForm({ ...form, corpo: `${form.corpo.slice(0, at)}{{${key}}}${form.corpo.slice(at)}` });
        setTimeout(() => el?.focus(), 0);
    };
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const t = initial.id ? await minutasApi.updateTemplate(initial.id, form) : await minutasApi.addTemplate(form);
            toast.success('Modelo salvo. Ele já aparece em "Nova minuta".');
            onSaved(t);
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <FormModal size="xl" onClose={onCancel} onSubmit={save} busy={busy} submitLabel="Salvar modelo"
            title={initial.id ? 'Editar modelo' : initial.importado ? 'Conferir modelo importado' : 'Novo modelo'}>
            {initial.importado && (
                <Banner tone="info">Confira o texto. As marcações do arquivo ([CLIENTE], «vara», &lt;&lt;DATA&gt;&gt;…) viraram campos.
                    Os campos que o Cadrius conhece são preenchidos sozinhos; os demais pedem para completar ao gerar a minuta.</Banner>
            )}
            <FilterBar>
                <Field label="Nome" className={styles.flex_2}>
                    <Input required minLength={3} maxLength={120} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </Field>
                <Field label="Tipo">
                    <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                        {TEMPLATE_KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </Select>
                </Field>
            </FilterBar>
            <div className={`${styles.two_col} ${styles.align_start}`}>
                <Field label="Texto do modelo">
                    <Textarea ref={ref} className={styles.doc_editor} required minLength={10} maxLength={30000} value={form.corpo}
                        onChange={(e) => setForm({ ...form, corpo: e.target.value })} />
                </Field>
                <Stack gap={2}>
                    <div className={styles.field}>Campos deste modelo ({fields.length})</div>
                    <Row gap={1}>
                        {fields.length === 0 && <span className={styles.muted}>Nenhum ainda.</span>}
                        {fields.map((f) => <Pill key={f} tone={f.startsWith('campo.') ? 'yellow' : 'green'}>{fieldLabel(f, vars)}</Pill>)}
                    </Row>
                    <div className={styles.field}>Inserir campo do Cadrius</div>
                    <Row gap={1}>
                        {vars.map((v) => <Button key={v.chave} size="sm" title={`{{${v.chave}}}`} onClick={() => insert(v.chave)}>{v.label}</Button>)}
                    </Row>
                    <span className={styles.muted}>Verde: preenchido sozinho. Amarelo: campo do seu modelo, pedido ao gerar.</span>
                </Stack>
            </div>
        </FormModal>
    );
}

// Aba "Modelos" de Minutas (CAD-231): os modelos do escritório, importar do Word/PDF e reaproveitar sempre
export default function ModelosTab({ templates, vars, canManage, onUse, onChanged }) {
    const own = templates.filter((t) => t.do_escritorio);
    const builtin = templates.filter((t) => !t.do_escritorio);
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState(false);
    const file = useRef(null);
    const pick = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        setBusy(true);
        try { setEditing({ ...(await minutasApi.importTemplate(f)), importado: true }); }
        catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const remove = async (t) => {
        if (!window.confirm(`Excluir o modelo "${t.nome}"? As minutas já geradas continuam.`)) return;
        try { await minutasApi.removeTemplate(t.id); toast.success('Modelo excluído.'); onChanged(); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <Stack>
            {canManage && (
                <Row>
                    <input ref={file} type="file" accept=".docx,.pdf,.txt,.md" hidden onChange={pick} />
                    <Button variant="primary" icon={FiUpload} loading={busy} loadingLabel="Lendo arquivo…" onClick={() => file.current?.click()}>
                        Importar modelo (Word, PDF ou texto)</Button>
                    <Button icon={FiPlus} onClick={() => setEditing({ nome: '', tipo: 'outro', corpo: '' })}>Escrever modelo</Button>
                </Row>
            )}
            <div className={`${styles.section_title} ${styles.mb_0}`}>Do escritório</div>
            {own.length === 0 && <Empty title="Nenhum modelo do escritório">Importe as peças que vocês já usam: o Cadrius reconhece os campos e preenche com os dados do processo, do cliente e do escritório.</Empty>}
            <div className={styles.card_grid}>
                {own.map((t) => (
                    <Stack key={t.chave} gap={2} className={styles.card}>
                        <Row gap={3} wrap={false}>
                            <FiFileText aria-hidden="true" size={22} color="var(--c-primary)" />
                            <strong className={`${styles.clamp2} ${styles.flex_1}`}>{t.nome}</strong>
                        </Row>
                        <Row gap={1}><Pill tone="blue">{kindLabel(t.tipo)}</Pill><Pill tone="gray">{(t.campos || []).length} campos</Pill></Row>
                        <p className={`${styles.muted} ${styles.clamp3} ${styles.mt_0} ${styles.mb_0} ${styles.flex_1}`}>{t.corpo}</p>
                        <Row>
                            <Button size="sm" variant="primary" onClick={() => onUse(t.chave)}>Usar</Button>
                            {canManage && <Button size="sm" onClick={() => setEditing(t)}>Editar</Button>}
                            {canManage && <Button size="sm" variant="danger" onClick={() => remove(t)}>Excluir</Button>}
                        </Row>
                    </Stack>
                ))}
            </div>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Prontos do Cadrius</div>
            <div className={styles.card_grid}>
                {builtin.map((t) => (
                    <Stack key={t.chave} gap={2} className={styles.card}>
                        <strong className={styles.clamp2}>{t.nome}</strong>
                        <div><Pill tone="gray">{kindLabel(t.tipo)}</Pill></div>
                        <Row>
                            <Button size="sm" onClick={() => onUse(t.chave)}>Usar</Button>
                            {canManage && <Button size="sm" variant="ghost"
                                onClick={() => setEditing({ nome: `${t.nome} (cópia)`, tipo: t.tipo, corpo: t.corpo })}>Copiar e ajustar</Button>}
                        </Row>
                    </Stack>
                ))}
            </div>
            {editing && <ModeloForm initial={editing} vars={vars} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />}
        </Stack>
    );
}
