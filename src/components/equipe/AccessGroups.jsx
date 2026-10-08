import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiEdit2, FiPlus, FiShield, FiTrash2 } from 'react-icons/fi';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, errorMessage, Loading, Pill } from '../seguranca/ui';
import { accessApi, fromMatrix, toMatrix } from '../../services/cad223';
import useLoader from '../../pages/gestao/useLoader';

// Grupos de acesso (CAD-223): o dono/admin decide o que cada pessoa da equipe vê e altera.
export function AccessGroups() {
    const { data, error, reload: load } = useLoader(() => Promise.all([accessApi.catalog(), accessApi.groups(), accessApi.members()]), []);
    const [editing, setEditing] = useState(null);
    const [cat, groups, members] = data || [null, [], []];

    const fromPreset = async (modelo) => {
        try { await accessApi.create({ modelo }); toast.success('Grupo criado a partir do modelo.'); load(); } catch (e) { toast.error(errorMessage(e)); }
    };
    const assign = async (member, grupoId) => {
        try { await accessApi.assign(member.id, grupoId); toast.success('Acesso atualizado.'); load(); } catch (e) { toast.error(errorMessage(e)); }
    };
    const remove = async (g) => {
        if (!window.confirm(`Apagar o grupo "${g.nome}"? As ${g.membros} pessoa(s) dele voltam às regras do cargo.`)) return;
        try { await accessApi.remove(g.id); load(); } catch (e) { toast.error(errorMessage(e)); }
    };

    if (error) return <Banner tone="error">{error}</Banner>;
    if (!cat) return <Loading />;
    const usedPresets = new Set(groups.map((g) => g.nome));
    return (
        <div className={styles.stack}>
            <p className={styles.muted} style={{ margin: 0 }}>Dono e administrador veem tudo; quem entra num grupo vê só os módulos marcados.</p>

            <section className={styles.card}>
                <div className={styles.section_title}>Quem acessa o quê</div>
                <div className={styles.table_wrap} style={{ marginTop: 12 }}>
                    <table className={styles.table}>
                        <thead><tr><th>Pessoa</th><th>Cargo</th><th>Grupo de acesso</th></tr></thead>
                        <tbody>
                            {members.map((m) => {
                                const manager = ['owner', 'administrador'].includes(m.role);
                                return (
                                    <tr key={m.id}>
                                        <td><strong>{`${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email}</strong><div className={styles.muted}>{m.email}</div></td>
                                        <td>{manager ? <Pill tone="blue">{m.role === 'owner' ? 'Dono' : 'Administrador'}</Pill> : <Pill>{m.role === 'viewer' ? 'Somente leitura' : 'Membro'}</Pill>}</td>
                                        <td>
                                            {manager ? <span className={styles.muted}>Acesso total</span> : (
                                                <select className={styles.select} aria-label={`Grupo de ${m.email}`} value={m.grupo?.id || ''}
                                                    onChange={(e) => assign(m, e.target.value)}>
                                                    <option value="">Sem grupo (regras do cargo)</option>
                                                    {groups.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className={styles.card}>
                <div className={styles.btn_row} style={{ justifyContent: 'space-between' }}>
                    <div className={styles.section_title}>Grupos do escritório</div>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setEditing({ nome: '', descricao: '', permissoes: [] })}>
                        <FiPlus aria-hidden="true" /> Novo grupo
                    </button>
                </div>
                {groups.length === 0 && <p className={styles.muted}>Nenhum grupo ainda. Comece por um modelo abaixo e ajuste.</p>}
                <div className={styles.card_grid} style={{ marginTop: 12 }}>
                    {groups.map((g) => (
                        <div key={g.id} className={styles.card}>
                            <div className={styles.btn_row} style={{ justifyContent: 'space-between' }}>
                                <strong><FiShield aria-hidden="true" /> {g.nome}</strong>
                                <Pill>{g.membros} pessoa(s)</Pill>
                            </div>
                            {g.descricao && <p className={styles.muted}>{g.descricao}</p>}
                            <p className={styles.muted}>{summarize(g.permissoes, cat)}</p>
                            <div className={styles.btn_row}>
                                <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => setEditing(g)}><FiEdit2 aria-hidden="true" /> Editar</button>
                                <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_danger}`} onClick={() => remove(g)} aria-label={`Apagar ${g.nome}`}><FiTrash2 aria-hidden="true" /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.section_title} style={{ marginTop: 16 }}>Modelos prontos</div>
                <div className={styles.btn_row} style={{ marginTop: 8 }}>
                    {cat.modelos.filter((p) => !usedPresets.has(p.nome)).map((p) => (
                        <button key={p.chave} type="button" className={styles.chip} title={p.descricao} onClick={() => fromPreset(p.chave)}>+ {p.nome}</button>
                    ))}
                </div>
            </section>

            {editing && <GroupEditor cat={cat} group={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
        </div>
    );
}

function summarize(perms, cat) {
    const m = toMatrix(perms, cat.modulos);
    const edit = cat.modulos.filter((x) => m[x.chave] === 'editar').map((x) => x.rotulo);
    const see = cat.modulos.filter((x) => m[x.chave] === 'ver').map((x) => x.rotulo);
    const parts = [];
    if (edit.length) parts.push(`Altera: ${edit.join(', ')}`);
    if (see.length) parts.push(`Só consulta: ${see.join(', ')}`);
    return parts.join(' · ') || 'Nenhum módulo liberado.';
}

function GroupEditor({ cat, group, onClose, onSaved }) {
    const [nome, setNome] = useState(group.nome);
    const [descricao, setDescricao] = useState(group.descricao || '');
    const [matrix, setMatrix] = useState(() => toMatrix(group.permissoes, cat.modulos));
    const [extras, setExtras] = useState(() => (group.permissoes || []).filter((p) => cat.extras.some((e) => e.chave === p)));
    const [busy, setBusy] = useState(false);
    const byGroup = useMemo(() => cat.modulos.reduce((acc, m) => ({ ...acc, [m.grupo]: [...(acc[m.grupo] || []), m] }), {}), [cat]);

    const save = async () => {
        setBusy(true);
        const body = { nome, descricao, permissoes: fromMatrix(matrix, extras) };
        try {
            if (group.id) await accessApi.update(group.id, body); else await accessApi.create(body);
            toast.success('Grupo salvo.');
            onSaved();
        } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="group-title">
            <div className={styles.modal} style={{ maxWidth: 860 }}>
                <div id="group-title" className={styles.modal_title}>{group.id ? `Editar "${group.nome}"` : 'Novo grupo de acesso'}</div>
                <div className={styles.grid}>
                    <label className={styles.field}>Nome<input className={styles.input} value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} /></label>
                    <label className={styles.field}>Descrição<input className={styles.input} value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={200} /></label>
                </div>
                {Object.entries(byGroup).map(([section, mods]) => (
                    <div key={section}>
                        <div className={styles.card_title}>{section}</div>
                        {mods.map((m) => (
                            <div key={m.chave} className={styles.list_row} style={{ alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong>{m.rotulo}</strong>
                                    <div className={styles.muted}>{matrix[m.chave] === 'editar' ? m.editar : m.ver}</div>
                                </div>
                                <div className={styles.btn_row} role="radiogroup" aria-label={m.rotulo}>
                                    {[['nenhum', 'Sem acesso'], ['ver', 'Ver'], ['editar', 'Ver e alterar']].map(([v, lbl]) => (
                                        <button key={v} type="button" role="radio" aria-checked={matrix[m.chave] === v}
                                            className={`${styles.chip} ${matrix[m.chave] === v ? styles.chip_active : ''}`}
                                            onClick={() => setMatrix({ ...matrix, [m.chave]: v })}>{lbl}</button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
                <div>
                    <div className={styles.card_title}>Permissões extras (antes só do dono/administrador)</div>
                    {cat.extras.map((e) => (
                        <label key={e.chave} className={styles.check_row}>
                            <input type="checkbox" checked={extras.includes(e.chave)}
                                onChange={(ev) => setExtras(ev.target.checked ? [...extras, e.chave] : extras.filter((x) => x !== e.chave))} />
                            <span><strong>{e.rotulo}</strong> — <span className={styles.muted}>{e.concede}</span></span>
                        </label>
                    ))}
                </div>
                <div className={styles.btn_row} style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className={styles.btn} onClick={onClose}>Cancelar</button>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || nome.trim().length < 2} onClick={save}>Salvar grupo</button>
                </div>
            </div>
        </div>
    );
}

// Documento de referência (visível a toda a equipe): o que cada acesso concede.
export function AccessReference() {
    const { data: cat, error } = useLoader(() => accessApi.catalog(), []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!cat) return <Loading />;
    return (
        <div className={styles.stack}>
            {cat.meu_acesso && <Banner tone="info">Você está no grupo <strong>{cat.meu_acesso.grupo}</strong>.</Banner>}
            <section className={styles.card}>
                <div className={styles.section_title}>Regras gerais</div>
                <ul>{cat.regras.map((r) => <li key={r} className={styles.muted}>{r}</li>)}</ul>
            </section>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Módulo</th><th>"Ver" concede</th><th>"Ver e alterar" concede</th></tr></thead>
                    <tbody>
                        {cat.modulos.map((m) => (
                            <tr key={m.chave}>
                                <td><strong>{m.rotulo}</strong><div className={styles.muted}>{m.grupo}</div></td>
                                <td>{m.ver}</td>
                                <td>{m.editar}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Permissão extra</th><th>O que concede</th></tr></thead>
                    <tbody>{cat.extras.map((e) => <tr key={e.chave}><td><strong>{e.rotulo}</strong></td><td>{e.concede}</td></tr>)}</tbody>
                </table>
            </div>
        </div>
    );
}
