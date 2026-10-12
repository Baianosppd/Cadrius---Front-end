import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiEdit2, FiPlus, FiShield, FiTrash2 } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import { Banner, Button, Checkbox, Chip, Field, Input, Loading, Modal, Pill, Row, Segmented, Select, Stack, Table } from '../ui';
import { errorMessage } from '../../utils/format';
import { accessApi, fromMatrix, toMatrix } from '../../services/cad223';
import useLoader from '../../hooks/useLoader';

const LEVELS = [{ id: 'nenhum', label: 'Sem acesso' }, { id: 'ver', label: 'Ver' }, { id: 'editar', label: 'Ver e alterar' }];

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
        <Stack>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Dono e administrador veem tudo; quem entra num grupo vê só os módulos marcados.</p>

            <Stack as="section" gap={3} className={styles.card}>
                <div className={`${styles.section_title} ${styles.mb_0}`}>Quem acessa o quê</div>
                <Table flat columns={['Pessoa', 'Cargo', 'Grupo de acesso']}>
                    {members.map((m) => {
                        const manager = ['owner', 'administrador'].includes(m.role);
                        return (
                            <tr key={m.id}>
                                <td><strong>{`${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email}</strong><div className={styles.muted}>{m.email}</div></td>
                                <td data-label="Cargo">{manager ? <Pill tone="blue">{m.role === 'owner' ? 'Dono' : 'Administrador'}</Pill> : <Pill>{m.role === 'viewer' ? 'Somente leitura' : 'Membro'}</Pill>}</td>
                                <td data-label="Grupo">
                                    {manager ? <span className={styles.muted}>Acesso total</span> : (
                                        <Select aria-label={`Grupo de ${m.email}`} value={m.grupo?.id || ''} onChange={(e) => assign(m, e.target.value)}>
                                            <option value="">Sem grupo (regras do cargo)</option>
                                            {groups.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
                                        </Select>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </Table>
            </Stack>

            <Stack as="section" gap={3} className={styles.card}>
                <Row justify="between">
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Grupos do escritório</div>
                    <Button variant="primary" icon={FiPlus} onClick={() => setEditing({ nome: '', descricao: '', permissoes: [] })}>Novo grupo</Button>
                </Row>
                {groups.length === 0 && <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Nenhum grupo ainda. Comece por um modelo abaixo e ajuste.</p>}
                <div className={styles.card_grid}>
                    {groups.map((g) => (
                        <Stack key={g.id} gap={2} className={styles.card}>
                            <Row justify="between">
                                <Row gap={2}><FiShield aria-hidden="true" /><strong>{g.nome}</strong></Row>
                                <Pill>{g.membros} pessoa(s)</Pill>
                            </Row>
                            {g.descricao && <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>{g.descricao}</p>}
                            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>{summarize(g.permissoes, cat)}</p>
                            <Row gap={1}>
                                <Button size="sm" icon={FiEdit2} onClick={() => setEditing(g)}>Editar</Button>
                                <Button size="sm" variant="danger" icon={FiTrash2} onClick={() => remove(g)} aria-label={`Apagar ${g.nome}`} />
                            </Row>
                        </Stack>
                    ))}
                </div>
                <div className={`${styles.section_title} ${styles.mb_0} ${styles.mt_2}`}>Modelos prontos</div>
                <Row>
                    {cat.modelos.filter((p) => !usedPresets.has(p.nome)).map((p) => (
                        <Chip key={p.chave} title={p.descricao} onClick={() => fromPreset(p.chave)}><FiPlus aria-hidden="true" /> {p.nome}</Chip>
                    ))}
                </Row>
            </Stack>

            {editing && <GroupEditor cat={cat} group={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
        </Stack>
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
        // Muitas escolhas: clique fora não fecha
        <Modal title={group.id ? `Editar "${group.nome}"` : 'Novo grupo de acesso'} size="xl" onClose={onClose} busy={busy} closeOnOverlay={false}
            footer={<>
                <Button variant="primary" disabled={nome.trim().length < 2} loading={busy} loadingLabel="Salvando…" onClick={save}>Salvar grupo</Button>
                <Button onClick={onClose} disabled={busy}>Cancelar</Button>
            </>}>
            <div className={styles.grid}>
                <Field label="Nome"><Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} /></Field>
                <Field label="Descrição"><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={200} /></Field>
            </div>
            {Object.entries(byGroup).map(([section, mods]) => (
                <div key={section}>
                    <div className={styles.card_title}>{section}</div>
                    {mods.map((m) => (
                        <div key={m.chave} className={`${styles.list_row} ${styles.align_start}`}>
                            <div className={styles.flex_1}>
                                <strong>{m.rotulo}</strong>
                                <div className={styles.muted}>{matrix[m.chave] === 'editar' ? m.editar : m.ver}</div>
                            </div>
                            <Segmented options={LEVELS} value={matrix[m.chave]} onChange={(v) => setMatrix({ ...matrix, [m.chave]: v })} aria-label={m.rotulo} />
                        </div>
                    ))}
                </div>
            ))}
            <Stack gap={2}>
                <div className={styles.card_title}>Permissões extras (antes só do dono/administrador)</div>
                {cat.extras.map((e) => (
                    <Checkbox key={e.chave} checked={extras.includes(e.chave)}
                        onChange={(ev) => setExtras(ev.target.checked ? [...extras, e.chave] : extras.filter((x) => x !== e.chave))}>
                        <span><strong>{e.rotulo}</strong> — <span className={styles.muted}>{e.concede}</span></span>
                    </Checkbox>
                ))}
            </Stack>
        </Modal>
    );
}

// Documento de referência (visível a toda a equipe): o que cada acesso concede.
export function AccessReference() {
    const { data: cat, error } = useLoader(() => accessApi.catalog(), []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!cat) return <Loading />;
    return (
        <Stack>
            {cat.meu_acesso && <Banner tone="info">Você está no grupo <strong>{cat.meu_acesso.grupo}</strong>.</Banner>}
            <section className={styles.card}>
                <div className={styles.section_title}>Regras gerais</div>
                <ul className={styles.list_indent}>{cat.regras.map((r) => <li key={r} className={styles.muted}>{r}</li>)}</ul>
            </section>
            <Table columns={['Módulo', '"Ver" concede', '"Ver e alterar" concede']}>
                {cat.modulos.map((m) => (
                    <tr key={m.chave}>
                        <td><strong>{m.rotulo}</strong><div className={styles.muted}>{m.grupo}</div></td>
                        <td data-label="Ver">{m.ver}</td>
                        <td data-label="Ver e alterar">{m.editar}</td>
                    </tr>
                ))}
            </Table>
            <Table columns={['Permissão extra', 'O que concede']}>
                {cat.extras.map((e) => <tr key={e.chave}><td><strong>{e.rotulo}</strong></td><td data-label="Concede">{e.concede}</td></tr>)}
            </Table>
        </Stack>
    );
}
