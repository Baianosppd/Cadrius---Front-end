import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ui from '../ui/ui.module.css';
import { Button, Checkbox, Field, FilterBar, Input, Pill, Row, Select, Stack, Table } from '../ui';
import { errorMessage, fmtDateTime } from '../../utils/format';
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
    const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    return (
        <Stack>
            <Row justify="between">
                <div className={`${ui.section_title} ${ui.mb_0}`}>Seus compromissos do Google</div>
                {!form && <Button size="sm" variant="primary" onClick={() => setForm(blank)}>Novo compromisso</Button>}
            </Row>
            {form && (
                <Stack as="form" gap={3} className={ui.card} onSubmit={submitNew} aria-label="Novo compromisso no Google Agenda">
                    <Field label="Título">
                        <Input required maxLength={200} value={form.titulo} placeholder="Ex.: Reunião com a cliente Maria" onChange={setF('titulo')} />
                    </Field>
                    <FilterBar>
                        <Field label="Data"><Input type="date" required value={form.data} onChange={setF('data')} /></Field>
                        <Field label="Hora"><Input type="time" required value={form.hora} onChange={setF('hora')} /></Field>
                        <Field label="Duração (min)"><Input type="number" min="5" max="1440" value={form.duracao_min} onChange={setF('duracao_min')} /></Field>
                    </FilterBar>
                    <Field label="Local (opcional)"><Input maxLength={300} value={form.local} onChange={setF('local')} /></Field>
                    <Field label="Convidados (e-mails, opcional)"><Input value={form.convidados} placeholder="maria@email.com, joao@email.com" onChange={setF('convidados')} /></Field>
                    {form.convidados.trim() && (
                        <Checkbox checked={form.avisar_convidados} onChange={(e) => setForm({ ...form, avisar_convidados: e.target.checked })}>
                            Mandar o convite por e-mail aos convidados (pelo Google)
                        </Checkbox>
                    )}
                    <Row>
                        <Button type="submit" variant="primary" loading={busy} loadingLabel="Criando…">Criar no Google Agenda</Button>
                        <Button onClick={() => setForm(null)}>Cancelar</Button>
                    </Row>
                </Stack>
            )}
            <Checkbox checked={status.import_events} disabled={busy} onChange={(e) => save({ import_events: e.target.checked })}>
                Trazer prazos, audiências e reuniões que eu criar direto no Google Agenda
            </Checkbox>
            {status.import_events && (
                <>
                    <FilterBar>
                        <Field label="Até quantos dias à frente">
                            <Select value={status.lookahead_days} disabled={busy} onChange={(e) => save({ lookahead_days: Number(e.target.value) })}>
                                {[30, 60, 90, 180].map((d) => <option key={d} value={d}>{d} dias</option>)}
                            </Select>
                        </Field>
                    </FilterBar>
                    <div className={ui.field}>Viram tarefa no Cadrius (e entram nos avisos de "Prazo chegando")
                        <Row gap={4}>
                            {EVENT_KINDS.map(([k, label]) => (
                                <Checkbox key={k} checked={status.task_kinds.includes(k)} disabled={busy} onChange={() => toggleKind(k)}>{label}</Checkbox>
                            ))}
                        </Row>
                    </div>
                    <div className={ui.card}>
                        <div className={ui.card_title}>Alertas prontos</div>
                        {AGENDA_ALERTS.map((a) => (
                            <div key={a.modelo} className={ui.list_row}>
                                <span className={ui.flex_1}><strong>{a.titulo}</strong><br /><span className={ui.muted}>{a.canal} · horário comercial · aprovação antes de enviar</span></span>
                                {isOrgManager && <Button size="sm" onClick={() => createAlert(a.modelo)}>Criar alerta</Button>}
                            </div>
                        ))}
                        <span className={ui.muted}>Quer outro canal, antecedência ou texto? Em Automações → Nova regra → "Compromisso da Agenda Google chegando".</span>
                    </div>
                    <div className={ui.card_title}>Próximos compromissos trazidos {status.events_synced_at && <span className={ui.muted}>· atualizado {fmtDateTime(status.events_synced_at)}</span>}</div>
                    {events && events.length === 0 && <div className={ui.muted}>Nada nos próximos dias. Crie um compromisso aqui, pelo Assistente ("marque reunião amanhã às 10h") ou no próprio Google.</div>}
                    {events && events.length > 0 && (
                        <Table columns={['Quando', 'Compromisso', 'Tipo', 'Cliente / processo', 'Tarefa', { label: 'Ações', className: ui.td_actions }]}>
                            {events.slice(0, 20).map((ev) => {
                                const ed = editing?.id === ev.id;
                                return (
                                    <tr key={ev.id}>
                                        <td>{ed ? (
                                            <Row gap={1} wrap={false}>
                                                <Input type="date" aria-label="Nova data" value={editing.data} onChange={(e) => setEditing({ ...editing, data: e.target.value })} />
                                                <Input type="time" aria-label="Nova hora" value={editing.hora} onChange={(e) => setEditing({ ...editing, hora: e.target.value })} />
                                            </Row>) : fmtDateTime(ev.inicio)}</td>
                                        <td data-label="Compromisso">{ed
                                            ? <Input aria-label="Título" value={editing.titulo} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} />
                                            : ev.titulo}</td>
                                        <td data-label="Tipo">
                                            <Select aria-label={`Tipo de ${ev.titulo}`} value={ev.tipo} onChange={(e) => setKind(ev, e.target.value)}>
                                                {EVENT_KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                                            </Select>
                                        </td>
                                        <td data-label="Cliente / processo">{ev.cliente || '—'}{ev.processo && <div className={ui.muted}>{ev.processo}</div>}</td>
                                        <td data-label="Tarefa">{ev.tarefa_id ? <Pill tone="green">Criada</Pill> : <Pill tone="gray">—</Pill>}</td>
                                        <td className={ui.td_actions}>
                                            <Row gap={1} wrap={false}>
                                                {ed ? (<>
                                                    <Button size="sm" variant="primary" loading={busy} onClick={() => reschedule(ev)}>Salvar</Button>
                                                    <Button size="sm" onClick={() => setEditing(null)}>Voltar</Button>
                                                </>) : (<>
                                                    <Button size="sm" onClick={() => startEdit(ev)}>Alterar</Button>
                                                    <Button size="sm" variant="danger" onClick={() => cancel(ev)}>Cancelar</Button>
                                                </>)}
                                            </Row>
                                        </td>
                                    </tr>
                                );
                            })}
                        </Table>
                    )}
                </>
            )}
        </Stack>
    );
}
