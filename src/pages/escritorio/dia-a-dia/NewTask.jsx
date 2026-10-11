import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCalendar, FiMessageCircle } from 'react-icons/fi';
import styles from '../../../components/ui/ui.module.css';
import { Button, Checkbox, Field, FilterBar, Input, PageHeader, Row, Select, Stack, Textarea } from '../../../components/ui';
import { errorMessage } from '../../../utils/format';
import api from '../../../services/api.js';
import { gcal } from '../../../services/gcal';
import useAuth from '../../../hooks/useAuth';

const PRIORITIES = [['alta', 'Alta'], ['media', 'Média'], ['baixa', 'Baixa']];
const EXAMPLES = [
    'Crie uma tarefa para amanhã às 10h: revisar o contrato da Maria.',
    'Lembre a equipe de protocolar a réplica na sexta às 14h.',
    'Agende para segunda às 9h: ligar para o cliente sobre a audiência.',
];

// Daqui a 1 hora, hora cheia, no formato do <input type="datetime-local">
function nextHour() {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

// Nova tarefa (CAD-233): formulário no padrão do sistema, com a equipe real e a agenda do Google; quem prefere pedir em
// texto vai para o Assistente com a frase já escrita.
export default function NewTask() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [google, setGoogle] = useState(null);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({ titulo: '', descricao: '', dataHorario: nextHour(), prioridade: 'media', responsavel: '', sincronizar: false });
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    useEffect(() => {
        api.get('teams/members/').then((r) => setMembers(r.data.filter((m) => m.status !== 'inativo'))).catch(() => setMembers([]));
        gcal.status().then((s) => {
            const on = !!(s?.connected && s.status === 'active');
            setGoogle(on);
            if (on) set('sincronizar', true);
        }).catch(() => setGoogle(false));
    }, []);
    useEffect(() => { if (user?.id && !form.responsavel) set('responsavel', String(user.id)); }, [user, form.responsavel]);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.titulo.trim()) { toast.error('Dê um título para a tarefa.'); return; }
        setBusy(true);
        try {
            await api.post('tasks/', { ...form, titulo: form.titulo.trim(), dataHorario: new Date(form.dataHorario).toISOString(),
                responsavel: form.responsavel || user?.id });
            toast.success('Tarefa criada.');
            navigate('/dashboard');
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const mine = String(form.responsavel) === String(user?.id);

    return (
        <div className={styles.page}>
            <Button as={Link} to="/dashboard" variant="ghost" size="sm" icon={FiArrowLeft} className={styles.w_fit}>Painel</Button>
            <PageHeader title="Nova tarefa" />
            <div className={`${styles.two_col} ${styles.align_start}`}>
                <Stack as="form" className={styles.card} onSubmit={submit}>
                    <Field label="Título">
                        <Input autoFocus required maxLength={200} value={form.titulo} onChange={(e) => set('titulo', e.target.value)}
                            placeholder="Ex.: Revisar o contrato do cliente" />
                    </Field>
                    <Field label="Detalhes (opcional)">
                        <Textarea rows={3} maxLength={2000} value={form.descricao} onChange={(e) => set('descricao', e.target.value)} />
                    </Field>
                    <FilterBar>
                        <Field label="Quando">
                            <Input type="datetime-local" required value={form.dataHorario} onChange={(e) => set('dataHorario', e.target.value)} />
                        </Field>
                        {members.length > 1 && (
                            <Field label="Responsável">
                                <Select value={form.responsavel} onChange={(e) => set('responsavel', e.target.value)}>
                                    {members.map((m) => <option key={m.id} value={m.id}>{`${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email}</option>)}
                                </Select>
                            </Field>
                        )}
                    </FilterBar>
                    <div className={styles.field}>Prioridade
                        <div className={`${styles.segmented} ${styles.w_fit}`} role="group" aria-label="Prioridade">
                            {PRIORITIES.map(([k, l]) => (
                                <button key={k} type="button" aria-pressed={form.prioridade === k} className={form.prioridade === k ? styles.seg_on : ''}
                                    onClick={() => set('prioridade', k)}>{l}</button>
                            ))}
                        </div>
                    </div>
                    {google ? (
                        <Checkbox checked={form.sincronizar && mine} disabled={!mine} onChange={(e) => set('sincronizar', e.target.checked)}>
                            <FiCalendar aria-hidden="true" /> Colocar no meu Google Agenda {!mine && '(só para tarefas suas)'}
                        </Checkbox>
                    ) : google === false && (
                        <span className={styles.muted}>Quer a tarefa também no celular? <Link to="/integracoes">Conecte o Google</Link>.</span>
                    )}
                    <Row>
                        <Button type="submit" variant="primary" loading={busy} loadingLabel="Criando…">Criar tarefa</Button>
                        <Button onClick={() => navigate(-1)}>Cancelar</Button>
                    </Row>
                </Stack>
                <Stack as="aside" gap={3} className={styles.card} aria-label="Criar pelo Assistente">
                    <Row gap={2} className={`${styles.section_title} ${styles.mb_0}`}>
                        <FiMessageCircle aria-hidden="true" color="var(--c-primary)" /> Prefere pedir?
                    </Row>
                    <span className={styles.muted}>Escreva do seu jeito no Assistente: ele monta a tarefa e você confirma.</span>
                    {EXAMPLES.map((t) => (
                        <Link key={t} to={`/assistente?texto=${encodeURIComponent(t)}`} className={`${styles.chip} ${styles.chip_wide}`}>{t}</Link>
                    ))}
                </Stack>
            </div>
        </div>
    );
}
