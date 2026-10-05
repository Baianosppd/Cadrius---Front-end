import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import { AREAS, AREA_LABEL, MIN_REASON, backofficeApi, buildStaffBody } from '../../services/backoffice';
import useLoader from './useLoader';

function AreaChecks({ value, onChange }) {
    return (
        <div className={styles.btn_row}>
            {AREAS.map((a) => (
                <label key={a} className={styles.check_row}>
                    <input type="checkbox" checked={value.includes(a)}
                        onChange={(e) => onChange(e.target.checked ? [...value, a] : value.filter((x) => x !== a))} />
                    {AREA_LABEL[a]}
                </label>
            ))}
        </div>
    );
}

function NovaConta({ onDone, onCancel }) {
    const [form, setForm] = useState({ email: '', first_name: '', last_name: '', areas: [], reason: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const submit = async (e) => {
        e.preventDefault();
        const built = buildStaffBody(form);
        if (!built.ok) { setError(built.error); return; }
        setBusy(true);
        setError('');
        try {
            await backofficeApi.createStaff(built.body);
            toast.success('Conta criada. A pessoa recebeu o link para definir a senha.');
            onDone();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <form className={styles.card} onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
            <div className={styles.section_title}>Nova conta da equipe</div>
            <div className={styles.filters}>
                <label className={styles.field}>E-mail<input className={styles.input} type="email" value={form.email} onChange={set('email')} /></label>
                <label className={styles.field}>Nome<input className={styles.input} value={form.first_name} onChange={set('first_name')} /></label>
                <label className={styles.field}>Sobrenome<input className={styles.input} value={form.last_name} onChange={set('last_name')} /></label>
            </div>
            <div className={styles.field}>Áreas<AreaChecks value={form.areas} onChange={(areas) => setForm((f) => ({ ...f, areas }))} /></div>
            <label className={styles.field}>Motivo (mínimo {MIN_REASON} caracteres — fica na auditoria)
                <input className={styles.input} value={form.reason} onChange={set('reason')} maxLength={255} />
            </label>
            <Banner tone="info">A pessoa recebe por e-mail o link para definir a senha e, no 1º acesso à Gestão, cadastra a verificação em duas etapas.</Banner>
            {error && <Banner tone="error">{error}</Banner>}
            <div className={styles.btn_row}>
                <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>{busy ? 'Criando…' : 'Criar conta'}</button>
                <button type="button" className={styles.btn} onClick={onCancel} disabled={busy}>Cancelar</button>
            </div>
        </form>
    );
}

function EditarAreas({ person, onDone, onCancel }) {
    const [areas, setAreas] = useState(person.areas);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const save = async () => {
        if (reason.trim().length < MIN_REASON) { toast.error(`Informe o motivo (mínimo ${MIN_REASON} caracteres).`); return; }
        setBusy(true);
        try {
            const res = await backofficeApi.updateStaff(person.id, { areas, reason: reason.trim() });
            toast.success(res.areas.length ? 'Áreas atualizadas.' : 'Acesso à Gestão removido; sessões encerradas.');
            onDone();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.modal}>
                <div className={styles.modal_title}>Áreas de {person.email}</div>
                <AreaChecks value={areas} onChange={setAreas} />
                {!areas.length && <Banner tone="warn">Sem nenhuma área a pessoa deixa de ser da equipe e as sessões dela são encerradas.</Banner>}
                <label className={styles.field}>Motivo<input className={styles.input} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} /></label>
                <div className={styles.btn_row}>
                    <button type="button" className={`${styles.btn} ${areas.length ? styles.btn_primary : styles.btn_danger}`} onClick={save} disabled={busy}>Salvar</button>
                    <button type="button" className={styles.btn} onClick={onCancel} disabled={busy}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}

export default function Equipe() {
    const { data, error, reload } = useLoader(backofficeApi.staff);
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(null);
    return (
        <div className={styles.page}>
            <PageHeader title="Equipe Cadrius" subtitle="Contas de TI, Financeiro e Fiscal da Gestão"
                actions={!creating && <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setCreating(true)}>Nova conta</button>} />
            {creating && <NovaConta onCancel={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Carregando…</Empty>}
            {data && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Conta</th><th>Áreas</th><th>MFA</th><th>Último acesso</th><th /></tr></thead>
                        <tbody>
                            {data.length === 0 && <tr><td colSpan={5}><Empty>Ninguém na equipe.</Empty></td></tr>}
                            {data.map((p) => (
                                <tr key={p.id}>
                                    <td><strong>{p.email}</strong><div className={styles.muted}>{p.nome || '—'}</div>
                                        {p.superusuario && <Pill tone="blue">Superusuário</Pill>}{!p.ativo && <Pill tone="gray">Inativa</Pill>}</td>
                                    <td><span className={styles.btn_row}>{p.areas.length ? p.areas.map((a) => <Pill key={a} tone="blue">{AREA_LABEL[a] || a}</Pill>) : <Pill tone="gray">Sem área</Pill>}</span></td>
                                    <td>{p.mfa ? <Pill tone="green">Ativo</Pill> : <Pill tone="yellow">Pendente</Pill>}</td>
                                    <td>{fmtDateTime(p.ultimo_acesso)}</td>
                                    <td>{!p.superusuario && <button type="button" className={styles.btn} onClick={() => setEditing(p)}>Alterar áreas</button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {editing && <EditarAreas person={editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
        </div>
    );
}
