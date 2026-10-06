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
    const createAlert = async (modelo) => {
        try {
            await rulesApi.fromTemplate(modelo);
            toast.success('Alerta criado desligado: confira o texto, simule e ligue.');
            navigate('/automacao?aba=regras');
        } catch (e) { toast.error(errorMessage(e)); }
    };

    return (
        <div className={ui.stack}>
            <div className={ui.section_title}>Compromissos criados no Google</div>
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
                    {events && events.length === 0 && <div className={ui.muted}>Nada ainda. Clique em "Sincronizar agora" depois de conectar.</div>}
                    {events && events.length > 0 && (
                        <div className={ui.table_wrap}><table className={ui.table}>
                            <thead><tr><th>Quando</th><th>Compromisso</th><th>Tipo</th><th>Cliente / processo</th><th>Tarefa</th></tr></thead>
                            <tbody>{events.slice(0, 20).map((ev) => (
                                <tr key={ev.id}>
                                    <td>{fmtDateTime(ev.inicio)}</td>
                                    <td>{ev.titulo}</td>
                                    <td>
                                        <select className={ui.select} aria-label={`Tipo de ${ev.titulo}`} value={ev.tipo} onChange={(e) => setKind(ev, e.target.value)}>
                                            {EVENT_KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                                        </select>
                                    </td>
                                    <td>{ev.cliente || '—'}{ev.processo && <div className={ui.muted}>{ev.processo}</div>}</td>
                                    <td>{ev.tarefa_id ? <Pill tone="green">Criada</Pill> : <Pill tone="gray">—</Pill>}</td>
                                </tr>
                            ))}</tbody>
                        </table></div>
                    )}
                </>
            )}
        </div>
    );
}
