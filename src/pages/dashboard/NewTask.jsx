import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCalendar, FiMessageCircle } from 'react-icons/fi';
import styles from '../../components/seguranca/seguranca.module.css';
import { PageHeader, errorMessage } from '../../components/seguranca/ui';
import api from '../../services/api.js';
import { gcal } from '../../services/gcal';
import useAuth from '../../hooks/useAuth';

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
            <Link to="/dashboard" className={styles.link_btn} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                <FiArrowLeft aria-hidden="true" /> Painel</Link>
            <PageHeader title="Nova tarefa" />
            <div className={styles.two_col} style={{ alignItems: 'start' }}>
                <form className={`${styles.card} ${styles.stack}`} onSubmit={submit}>
                    <label className={styles.field}>Título
                        <input className={styles.input} autoFocus required maxLength={200} value={form.titulo} onChange={(e) => set('titulo', e.target.value)}
                            placeholder="Ex.: Revisar o contrato do cliente" /></label>
                    <label className={styles.field}>Detalhes (opcional)
                        <textarea className={styles.textarea} rows={3} maxLength={2000} value={form.descricao} onChange={(e) => set('descricao', e.target.value)} /></label>
                    <div className={styles.filters}>
                        <label className={styles.field}>Quando
                            <input className={styles.input} type="datetime-local" required value={form.dataHorario} onChange={(e) => set('dataHorario', e.target.value)} /></label>
                        {members.length > 1 && (
                            <label className={styles.field}>Responsável
                                <select className={styles.select} value={form.responsavel} onChange={(e) => set('responsavel', e.target.value)}>
                                    {members.map((m) => <option key={m.id} value={m.id}>{`${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email}</option>)}
                                </select></label>
                        )}
                    </div>
                    <div className={styles.field}>Prioridade
                        <div className={styles.segmented} role="group" aria-label="Prioridade" style={{ width: 'fit-content' }}>
                            {PRIORITIES.map(([k, l]) => (
                                <button key={k} type="button" aria-pressed={form.prioridade === k} className={form.prioridade === k ? styles.seg_on : ''}
                                    onClick={() => set('prioridade', k)}>{l}</button>
                            ))}
                        </div>
                    </div>
                    {google ? (
                        <label className={styles.check_row}>
                            <input type="checkbox" checked={form.sincronizar && mine} disabled={!mine} onChange={(e) => set('sincronizar', e.target.checked)} />
                            <FiCalendar aria-hidden="true" /> Colocar no meu Google Agenda {!mine && '(só para tarefas suas)'}
                        </label>
                    ) : google === false && (
                        <span className={styles.muted} style={{ fontSize: '.85rem' }}>Quer a tarefa também no celular? <Link to="/integracoes">Conecte o Google</Link>.</span>
                    )}
                    <div className={styles.btn_row}>
                        <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>{busy ? 'Criando…' : 'Criar tarefa'}</button>
                        <button type="button" className={styles.btn} onClick={() => navigate(-1)}>Cancelar</button>
                    </div>
                </form>
                <aside className={`${styles.card} ${styles.stack}`} aria-label="Criar pelo Assistente" style={{ gap: 10 }}>
                    <div className={styles.section_title} style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <FiMessageCircle aria-hidden="true" color="var(--c-primary)" /> Prefere pedir?</div>
                    <span className={styles.muted} style={{ fontSize: '.88rem' }}>Escreva do seu jeito no Assistente: ele monta a tarefa e você confirma.</span>
                    {EXAMPLES.map((t) => (
                        <Link key={t} to={`/assistente?texto=${encodeURIComponent(t)}`} className={styles.chip}
                            style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', padding: '8px 12px', textDecoration: 'none', minHeight: 36 }}>{t}</Link>
                    ))}
                </aside>
            </div>
        </div>
    );
}
