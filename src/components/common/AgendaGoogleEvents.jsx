import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ui from '../seguranca/seguranca.module.css';
import { Pill, errorMessage, fmtDateTime } from '../seguranca/ui';
import { AGENDA_ALERTS, EVENT_KINDS, gcal } from '../../services/gcal';
import { rulesApi } from '../../services/rules';
import useAuth from '../../hooks/useAuth';

// Compromissos criados direto no Google Agenda (CAD-222): o que trazer, o que vira tarefa, correção de tipo e alertas prontos.
export default function AgendaGoogleEvents({ status, onSaved }) {
    const navigate = useNavigate();
    const { isOrgManager } = useAuth();
    const [events, setEvents] = useState(null);
    const [busy, setBusy] = useState(false);
    const load = useCallback(() => gcal.events().then(setEvents).catch(() => setEvents([])), []);
    useEffect(() => { load(); }, [load]);

    const save = async (body) => {
        setBusy(true);
        try { await gcal.settings(body); toast.success('Preferência salva.'); onSaved?.(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
    };
    const toggleKind = (k) => {
        const kinds = status.task_kinds.includes(k) ? status.task_kinds.filter((x) => x !== k) : [...status.task_kinds, k];
        save({ task_kinds: kinds });
    };
    const setKind = async (ev, tipo) => {
        try { await gcal.updateEvent(ev.id, { tipo }); load(); } catch (e) { toast.error(errorMessage(e)); }
    };
    // CAD-230: criar, remarcar e cancelar direto no Google Agenda
    const today = new Date().toISOString().slice(0, 10);
    const blank = { titulo: '', data: today, hora: '10:00', duracao_min: 60, local: '', convidados: '', avisar_convidados: false };
    const [form, setForm] = useState(null);
    const [editing, setEditing] = useState(null);
    const submitNew = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await gcal.createEvent({
                titulo: form.titulo.trim(), inicio: `${form.data}T${form.hora || '09:00'}:00`, duracao_min: Number(form.duracao_min) || 60,
                local: form.local.trim(), avisar_convidados: form.avisar_convidados,
                convidados: form.convidados.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean),
            });
            toast.success('Compromisso criado no seu Google Agenda.');
            setForm(null); load();
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const reschedule = async (ev) => {
        setBusy(true);
        try {
            await gcal.updateEvent(ev.id, { inicio: `${editing.data}T${editing.hora}:00`, titulo: editing.titulo });
            toast.success('Compromisso atualizado no Google.');
            setEditing(null); load();
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const cancel = async (ev) => {
        if (!window.confirm(`Cancelar "${ev.titulo}" no Google Agenda?`)) return;
        try { await gcal.cancelEvent(ev.id); toast.success('Compromisso cancelado.'); load(); } catch (err) { toast.error(errorMessage(err)); }
    };
    const startEdit = (ev) => {
        const d = new Date(ev.inicio);
        const pad = (n) => String(n).padStart(2, '0');
        setEditing({ id: ev.id, titulo: ev.titulo, data: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
            hora: `${pad(d.getHours())}:${pad(d.getMinutes())}` });
    };

    const createAlert = async (modelo) => {
        try {
            await rulesApi.fromTemplate(modelo);
            toast.success('Alerta criado desligado: confira o texto, simule e ligue.');
            navigate('/automacao?aba=regras');
        } catch (e) { toast.error(errorMessage(e)); }
    };

    return (
        <div className={ui.stack}>
            <div className={ui.header_row} style={{ alignItems: 'center' }}>
                <div className={ui.section_title} style={{ margin: 0 }}>Seus compromissos do Google</div>
                {!form && <button type="button" className={`${ui.btn} ${ui.btn_sm} ${ui.btn_primary}`} onClick={() => setForm(blank)}>Novo compromisso</button>}
            </div>
            {form && (
                <form className={`${ui.card} ${ui.stack}`} onSubmit={submitNew} aria-label="Novo compromisso no Google Agenda">
                    <label className={ui.field}>Título
                        <input className={ui.input} required maxLength={200} value={form.titulo} placeholder="Ex.: Reunião com a cliente Maria"
                            onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></label>
                    <div className={ui.filters}>
                        <label className={ui.field}>Data<input className={ui.input} type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></label>
                        <label className={ui.field}>Hora<input className={ui.input} type="time" required value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></label>
                        <label className={ui.field}>Duração (min)<input className={ui.input} type="number" min="5" max="1440" value={form.duracao_min} onChange={(e) => setForm({ ...form, duracao_min: e.target.value })} /></label>
                    </div>
                    <label className={ui.field}>Local (opcional)<input className={ui.input} maxLength={300} value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} /></label>
                    <label className={ui.field}>Convidados (e-mails, opcional)<input className={ui.input} value={form.convidados} placeholder="maria@email.com, joao@email.com" onChange={(e) => setForm({ ...form, convidados: e.target.value })} /></label>
                    {form.convidados.trim() && (
                        <label className={ui.check_row}><input type="checkbox" checked={form.avisar_convidados} onChange={(e) => setForm({ ...form, avisar_convidados: e.target.checked })} /> Mandar o convite por e-mail aos convidados (pelo Google)</label>
                    )}
                    <div className={ui.btn_row}>
                        <button type="submit" className={`${ui.btn} ${ui.btn_primary}`} disabled={busy}>{busy ? 'Criando…' : 'Criar no Google Agenda'}</button>
                        <button type="button" className={ui.btn} onClick={() => setForm(null)}>Cancelar</button>
                    </div>
                </form>
            )}
            <label className={ui.check_row}>
                <input type="checkbox" checked={status.import_events} disabled={busy} onChange={(e) => save({ import_events: e.target.checked })} />
                Trazer prazos, audiências e reuniões que eu criar direto no Google Agenda
            </label>
            {status.import_events && (
                <>
                    <div className={ui.filters}>
                        <label className={ui.field}>Até quantos dias à frente
                            <select className={ui.select} value={status.lookahead_days} disabled={busy} onChange={(e) => save({ lookahead_days: Number(e.target.value) })}>
                                {[30, 60, 90, 180].map((d) => <option key={d} value={d}>{d} dias</option>)}
                            </select>
                        </label>
                    </div>
                    <div className={ui.field}>Viram tarefa no Cadrius (e entram nos avisos de "Prazo chegando")
                        <div className={ui.btn_row}>
                            {EVENT_KINDS.map(([k, label]) => (
                                <label key={k} className={ui.check_row}><input type="checkbox" checked={status.task_kinds.includes(k)} disabled={busy} onChange={() => toggleKind(k)} /> {label}</label>
                            ))}
                        </div>
                    </div>
                    <div className={ui.card}>
                        <div className={ui.card_title}>Alertas prontos</div>
                        {AGENDA_ALERTS.map((a) => (
                            <div key={a.modelo} className={ui.list_row}>
                                <span style={{ flex: 1 }}><strong>{a.titulo}</strong><br /><span className={ui.muted}>{a.canal} · horário comercial · aprovação antes de enviar</span></span>
                                {isOrgManager && <button type="button" className={`${ui.btn} ${ui.btn_sm}`} onClick={() => createAlert(a.modelo)}>Criar alerta</button>}
                            </div>
                        ))}
                        <span className={ui.muted}>Quer outro canal, antecedência ou texto? Em Automações → Nova regra → "Compromisso da Agenda Google chegando".</span>
                    </div>
                    <div className={ui.card_title}>Próximos compromissos trazidos {status.events_synced_at && <span className={ui.muted}>· atualizado {fmtDateTime(status.events_synced_at)}</span>}</div>
                    {events && events.length === 0 && <div className={ui.muted}>Nada nos próximos dias. Crie um compromisso aqui, pelo Assistente ("marque reunião amanhã às 10h") ou no próprio Google.</div>}
                    {events && events.length > 0 && (
                        <div className={ui.table_wrap}><table className={ui.table}>
                            <thead><tr><th>Quando</th><th>Compromisso</th><th>Tipo</th><th>Cliente / processo</th><th>Tarefa</th><th>Ações</th></tr></thead>
                            <tbody>{events.slice(0, 20).map((ev) => (
                                <tr key={ev.id}>
                                    <td>{editing?.id === ev.id ? (
                                        <span className={ui.btn_row} style={{ gap: 4 }}>
                                            <input className={ui.input} type="date" aria-label="Nova data" value={editing.data} onChange={(e) => setEditing({ ...editing, data: e.target.value })} />
                                            <input className={ui.input} type="time" aria-label="Nova hora" value={editing.hora} onChange={(e) => setEditing({ ...editing, hora: e.target.value })} />
                                        </span>) : fmtDateTime(ev.inicio)}</td>
                                    <td>{editing?.id === ev.id
                                        ? <input className={ui.input} aria-label="Título" value={editing.titulo} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} />
                                        : ev.titulo}</td>
                                    <td>
                                        <select className={ui.select} aria-label={`Tipo de ${ev.titulo}`} value={ev.tipo} onChange={(e) => setKind(ev, e.target.value)}>
                                            {EVENT_KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                                        </select>
                                    </td>
                                    <td>{ev.cliente || '—'}{ev.processo && <div className={ui.muted}>{ev.processo}</div>}</td>
                                    <td>{ev.tarefa_id ? <Pill tone="green">Criada</Pill> : <Pill tone="gray">—</Pill>}</td>
                                    <td><span className={ui.btn_row} style={{ gap: 4, flexWrap: 'nowrap' }}>
                                        {editing?.id === ev.id ? (<>
                                            <button type="button" className={`${ui.btn} ${ui.btn_sm} ${ui.btn_primary}`} disabled={busy} onClick={() => reschedule(ev)}>Salvar</button>
                                            <button type="button" className={`${ui.btn} ${ui.btn_sm}`} onClick={() => setEditing(null)}>Voltar</button>
                                        </>) : (<>
                                            <button type="button" className={`${ui.btn} ${ui.btn_sm}`} onClick={() => startEdit(ev)}>Alterar</button>
                                            <button type="button" className={`${ui.btn} ${ui.btn_sm} ${ui.btn_ghost}`} style={{ color: 'var(--c-danger)' }} onClick={() => cancel(ev)}>Cancelar</button>
                                        </>)}
                                    </span></td>
                                </tr>
                            ))}</tbody>
                        </table></div>
                    )}
                </>
            )}
        </div>
    );
}
