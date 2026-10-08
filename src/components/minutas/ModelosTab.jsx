import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiUpload, FiPlus, FiFileText } from 'react-icons/fi';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, Pill, errorMessage } from '../seguranca/ui';
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
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Modelo de minuta">
            <form className={styles.modal} style={{ maxWidth: 980 }} onSubmit={save}>
                <div className={styles.modal_title}>{initial.id ? 'Editar modelo' : initial.importado ? 'Conferir modelo importado' : 'Novo modelo'}</div>
                {initial.importado && (
                    <Banner tone="info">Confira o texto. As marcações do arquivo ([CLIENTE], «vara», &lt;&lt;DATA&gt;&gt;…) viraram campos.
                        Os campos que o Cadrius conhece são preenchidos sozinhos; os demais pedem para completar ao gerar a minuta.</Banner>
                )}
                <div className={styles.filters}>
                    <label className={styles.field} style={{ flex: 2 }}>Nome
                        <input className={styles.input} required minLength={3} maxLength={120} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
                    <label className={styles.field}>Tipo
                        <select className={styles.select} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                            {TEMPLATE_KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select></label>
                </div>
                <div className={styles.two_col} style={{ alignItems: 'start' }}>
                    <label className={styles.field}>Texto do modelo
                        <textarea ref={ref} className={styles.textarea} required minLength={10} maxLength={30000} value={form.corpo}
                            style={{ minHeight: 360, fontFamily: 'Georgia, serif', fontSize: 15 }} onChange={(e) => setForm({ ...form, corpo: e.target.value })} />
                    </label>
                    <div className={styles.stack} style={{ gap: 8 }}>
                        <div className={styles.field}>Campos deste modelo ({fields.length})</div>
                        <div className={styles.btn_row} style={{ gap: 4 }}>
                            {fields.length === 0 && <span className={styles.muted}>Nenhum ainda.</span>}
                            {fields.map((f) => <Pill key={f} tone={f.startsWith('campo.') ? 'yellow' : 'green'}>{fieldLabel(f, vars)}</Pill>)}
                        </div>
                        <div className={styles.field}>Inserir campo do Cadrius</div>
                        <div className={styles.btn_row} style={{ gap: 4 }}>
                            {vars.map((v) => (
                                <button key={v.chave} type="button" className={`${styles.btn} ${styles.btn_sm}`} title={`{{${v.chave}}}`} onClick={() => insert(v.chave)}>{v.label}</button>
                            ))}
                        </div>
                        <span className={styles.muted}>Verde: preenchido sozinho. Amarelo: campo do seu modelo, pedido ao gerar.</span>
                    </div>
                </div>
                <div className={styles.btn_row}>
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>{busy ? 'Salvando…' : 'Salvar modelo'}</button>
                    <button type="button" className={styles.btn} onClick={onCancel}>Cancelar</button>
                </div>
            </form>
        </div>
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
        <div className={styles.stack}>
            {canManage && (
                <div className={styles.btn_row}>
                    <input ref={file} type="file" accept=".docx,.pdf,.txt,.md" hidden onChange={pick} />
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy} onClick={() => file.current?.click()}>
                        <FiUpload aria-hidden="true" /> {busy ? 'Lendo arquivo…' : 'Importar modelo (Word, PDF ou texto)'}</button>
                    <button type="button" className={styles.btn} onClick={() => setEditing({ nome: '', tipo: 'outro', corpo: '' })}><FiPlus aria-hidden="true" /> Escrever modelo</button>
                </div>
            )}
            <div className={styles.section_title} style={{ marginBottom: 0 }}>Do escritório</div>
            {own.length === 0 && <Empty title="Nenhum modelo do escritório">Importe as peças que vocês já usam: o Cadrius reconhece os campos e preenche com os dados do processo, do cliente e do escritório.</Empty>}
            <div className={styles.card_grid}>
                {own.map((t) => (
                    <div key={t.chave} className={`${styles.card} ${styles.stack}`} style={{ gap: 8 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <FiFileText aria-hidden="true" size={22} color="var(--c-primary)" />
                            <strong className={styles.clamp2} style={{ minWidth: 0 }}>{t.nome}</strong>
                        </div>
                        <div className={styles.btn_row} style={{ gap: 4 }}><Pill tone="blue">{kindLabel(t.tipo)}</Pill><Pill tone="gray">{(t.campos || []).length} campos</Pill></div>
                        <p className={`${styles.muted} ${styles.clamp3}`} style={{ fontSize: '.85rem', margin: 0, flex: 1 }}>{t.corpo}</p>
                        <div className={styles.btn_row}>
                            <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_primary}`} onClick={() => onUse(t.chave)}>Usar</button>
                            {canManage && <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => setEditing(t)}>Editar</button>}
                            {canManage && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} style={{ color: 'var(--c-danger)' }} onClick={() => remove(t)}>Excluir</button>}
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.section_title} style={{ marginBottom: 0 }}>Prontos do Cadrius</div>
            <div className={styles.card_grid}>
                {builtin.map((t) => (
                    <div key={t.chave} className={`${styles.card} ${styles.stack}`} style={{ gap: 8 }}>
                        <strong className={styles.clamp2}>{t.nome}</strong>
                        <div><Pill tone="gray">{kindLabel(t.tipo)}</Pill></div>
                        <div className={styles.btn_row}>
                            <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => onUse(t.chave)}>Usar</button>
                            {canManage && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`}
                                onClick={() => setEditing({ nome: `${t.nome} (cópia)`, tipo: t.tipo, corpo: t.corpo })}>Copiar e ajustar</button>}
                        </div>
                    </div>
                ))}
            </div>
            {editing && <ModeloForm initial={editing} vars={vars} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />}
        </div>
    );
}
