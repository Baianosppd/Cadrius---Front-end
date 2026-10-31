import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import styles from '../../components/ui/ui.module.css';
import { Banner, Button, Empty, Field, FilterBar, FormModal, Input, Loading, PageHeader, Pill, Row, Select, Stack, Table } from '../../components/ui';
import { errorMessage, fmtDateTime } from '../../utils/format';
import { AREAS, AREA_LABEL, MIN_REASON, backofficeApi, buildStaffBody } from '../../services/backoffice';
import useLoader from '../../hooks/useLoader';

// CAD-223: cada área com nível — sem acesso, só consulta (lê, não altera) ou total
function AreaChecks({ value, onChange }) {
    const level = (a) => (value.areas.includes(a) ? 'total' : value.consulta.includes(a) ? 'consulta' : '');
    const setLevel = (a, lv) => onChange({
        areas: lv === 'total' ? [...value.areas.filter((x) => x !== a), a] : value.areas.filter((x) => x !== a),
        consulta: lv === 'consulta' ? [...value.consulta.filter((x) => x !== a), a] : value.consulta.filter((x) => x !== a),
    });
    return (
        <FilterBar role="group" aria-label="Áreas e níveis de acesso">
            {AREAS.map((a) => (
                <Field key={a} label={AREA_LABEL[a]}>
                    <Select value={level(a)} onChange={(e) => setLevel(a, e.target.value)}>
                        <option value="">Sem acesso</option><option value="consulta">Só consulta</option><option value="total">Total</option>
                    </Select>
                </Field>
            ))}
        </FilterBar>
    );
}

function NovaConta({ onDone, onCancel }) {
    const [form, setForm] = useState({ email: '', first_name: '', last_name: '', areas: [], consulta: [], reason: '' });
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
        <FormModal title="Nova conta da equipe" size="lg" onClose={onCancel} onSubmit={submit} busy={busy} error={error}
            submitLabel="Criar conta" busyLabel="Criando…">
            <FilterBar>
                <Field label="E-mail"><Input type="email" value={form.email} onChange={set('email')} /></Field>
                <Field label="Nome"><Input value={form.first_name} onChange={set('first_name')} /></Field>
                <Field label="Sobrenome"><Input value={form.last_name} onChange={set('last_name')} /></Field>
            </FilterBar>
            <Stack gap={1}>
                <span className={styles.text_sm}>Áreas</span>
                <AreaChecks value={form} onChange={(v) => setForm((f) => ({ ...f, ...v }))} />
            </Stack>
            <Field label="Motivo" hint={`Mínimo de ${MIN_REASON} caracteres. Fica registrado na auditoria.`}>
                <Input value={form.reason} onChange={set('reason')} maxLength={255} />
            </Field>
            <Banner tone="info">A pessoa recebe por e-mail o link para definir a senha e, no 1º acesso à Gestão, cadastra a verificação em duas etapas.</Banner>
        </FormModal>
    );
}

function EditarAreas({ person, onDone, onCancel }) {
    const [lv, setLv] = useState(() => ({
        areas: Object.entries(person.niveis || {}).filter(([, v]) => v === 'total').map(([k]) => k),
        consulta: Object.entries(person.niveis || {}).filter(([, v]) => v === 'consulta').map(([k]) => k),
    }));
    const areas = [...lv.areas, ...lv.consulta];
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const save = async (e) => {
        e.preventDefault();
        if (reason.trim().length < MIN_REASON) { setError(`Informe o motivo (mínimo ${MIN_REASON} caracteres).`); return; }
        setBusy(true);
        setError('');
        try {
            const res = await backofficeApi.updateStaff(person.id, { areas: lv.areas, consulta: lv.consulta, reason: reason.trim() });
            toast.success(res.areas.length ? 'Áreas atualizadas.' : 'Acesso à Gestão removido; sessões encerradas.');
            onDone();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <FormModal title={`Áreas de ${person.email}`} size="lg" onClose={onCancel} onSubmit={save} busy={busy} error={error}
            submitVariant={areas.length ? 'primary' : 'danger'}>
            <AreaChecks value={lv} onChange={setLv} />
            {!areas.length && <Banner tone="warn">Sem nenhuma área a pessoa deixa de ser da equipe e as sessões dela são encerradas.</Banner>}
            <Field label="Motivo" hint={`Mínimo de ${MIN_REASON} caracteres. Fica registrado na auditoria.`}>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} />
            </Field>
        </FormModal>
    );
}

function ReferenciaAreas() {
    const { data } = useLoader(backofficeApi.me);
    if (!data?.catalogo_areas) return null;
    return (
        <Table columns={['Área', 'Total concede', 'Só consulta concede']}>
            {data.catalogo_areas.map((a) => (
                <tr key={a.chave}><td><strong>{a.rotulo}</strong></td><td data-label="Total concede">{a.total}</td><td data-label="Só consulta concede">{a.consulta}</td></tr>
            ))}
        </Table>
    );
}

export default function Equipe() {
    const { data, error, reload } = useLoader(backofficeApi.staff);
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(null);
    return (
        <div className={styles.page}>
            <PageHeader title="Equipe Cadrius" subtitle="Contas da Gestão por área"
                actions={<Button variant="primary" icon={FiPlus} onClick={() => setCreating(true)}>Nova conta</Button>} />
            {creating && <NovaConta onCancel={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && (
                <Table columns={['Conta', 'Áreas', 'MFA', 'Último acesso', { label: '', className: styles.td_actions }]}
                    empty={data.length === 0 && <Empty>Ninguém na equipe.</Empty>}>
                    {data.map((p) => (
                        <tr key={p.id}>
                            <td><strong>{p.email}</strong><div className={styles.muted}>{p.nome || '—'}</div>
                                {p.superusuario && <Pill tone="blue">Superusuário</Pill>}{!p.ativo && <Pill tone="gray">Inativa</Pill>}</td>
                            <td data-label="Áreas">
                                <Row gap={1}>{p.areas.length ? p.areas.map((a) => (
                                    <Pill key={a} tone={p.niveis?.[a] === 'consulta' ? 'gray' : 'blue'}>{AREA_LABEL[a] || a}{p.niveis?.[a] === 'consulta' ? ' (consulta)' : ''}</Pill>
                                )) : <Pill tone="gray">Sem área</Pill>}</Row>
                            </td>
                            <td data-label="MFA">{p.mfa ? <Pill tone="green">Ativo</Pill> : <Pill tone="yellow">Pendente</Pill>}</td>
                            <td data-label="Último acesso">{fmtDateTime(p.ultimo_acesso)}</td>
                            <td className={styles.td_actions}>{!p.superusuario && <Button size="sm" onClick={() => setEditing(p)}>Alterar áreas</Button>}</td>
                        </tr>
                    ))}
                </Table>
            )}
            <div className={`${styles.section_title} ${styles.mb_0}`}>O que cada área concede</div>
            <ReferenciaAreas />
            {editing && <EditarAreas person={editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
        </div>
    );
}
