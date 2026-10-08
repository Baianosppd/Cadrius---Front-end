import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { SiGoogle, SiGooglecalendar, SiGooglesheets, SiGoogledocs } from 'react-icons/si';
import { gcal, gcalResult, GCAL_STATUS_LABEL } from '../../services/gcal';
import { errorMessage } from '../seguranca/ui';
import ui from '../seguranca/seguranca.module.css';
import AgendaGoogleEvents from './AgendaGoogleEvents';

const input = { width: '100%', padding: 8, border: '1px solid var(--c-border-2)', borderRadius: 6 };
const chip = { display: 'inline-flex', gap: 6, alignItems: 'center' };

// CAD-230: uma conexão Google só (Agenda + Planilhas + Documentos). Com o app do Cadrius no servidor, a pessoa só clica em
// "Conectar Google"; o app próprio do escritório continua possível em "Avançado".
export default function GoogleCalendarCard() {
    const [st, setSt] = useState(null);
    const [form, setForm] = useState({ client_id: '', client_secret: '', share_details: true, event_minutes: 30 });
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => gcal.status().then((s) => {
        setSt(s);
        setForm((f) => ({ ...f, client_id: s.client_id || '', share_details: s.share_details, event_minutes: s.event_minutes }));
    }).catch(() => setSt(null)), []);
    useEffect(() => { load(); }, [load]);

    // Volta do Google: /integracoes?gcal=ok|denied|…
    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get('gcal');
        const r = gcalResult(code);
        if (r) { toast[r.tone](r.text); window.history.replaceState(null, '', window.location.pathname); }
    }, []);

    if (!st) return null;   // usuário sem escritório
    const run = async (fn, okMsg) => {
        setBusy(true);
        try { const r = await fn(); if (okMsg) toast.success(okMsg); return r; } catch (e) { toast.error(errorMessage(e)); return null; } finally { setBusy(false); }
    };
    const saveApp = async (e) => {
        e.preventDefault();
        const body = { client_id: form.client_id.trim(), share_details: form.share_details, event_minutes: Number(form.event_minutes) };
        if (form.client_secret) body.client_secret = form.client_secret;
        if (await run(() => gcal.saveApp(body), 'App do escritório salvo. Quem já conectou precisa reconectar.')) {
            setForm((f) => ({ ...f, client_secret: '' })); load();
        }
    };
    const savePrefs = () => run(() => gcal.saveApp({ share_details: form.share_details, event_minutes: Number(form.event_minutes) }),
        'Preferências salvas.').then(load);
    const connect = async () => { const r = await run(gcal.connect); if (r?.authorization_url) window.location.href = r.authorization_url; };
    const active = st.connected && st.status === 'active';
    const docsOk = st.recursos?.planilhas_documentos;

    return (
        <section aria-label="Google" className={`${ui.card} ${ui.stack}`}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#fff', border: '1px solid var(--c-border)', flexShrink: 0 }}>
                    <SiGoogle size={22} color="#4285F4" />
                </span>
                <div style={{ minWidth: 0 }}>
                    <h2 className={ui.section_title} style={{ margin: 0 }}>Google: Agenda, Planilhas e Documentos</h2>
                    <span className={ui.muted} style={{ fontSize: '.85rem' }}>
                        {active ? `Conectado${st.google_email ? ` como ${st.google_email}` : ''}`
                            : st.connected ? GCAL_STATUS_LABEL[st.status] : 'Uma conexão só para tudo do Google'}
                        {st.last_sync_at && active && <> · sincronizado {new Date(st.last_sync_at).toLocaleString('pt-BR')}</>}
                    </span>
                </div>
            </div>

            <div className={ui.btn_row} style={{ gap: 8 }}>
                <span className={ui.chip} style={chip}><SiGooglecalendar color="#1a73e8" aria-hidden="true" /> Agenda: ler, criar e alterar{active ? ' ✓' : ''}</span>
                <span className={ui.chip} style={chip}><SiGooglesheets color="#0f9d58" aria-hidden="true" /> Planilhas{active && docsOk ? ' ✓' : ''}</span>
                <span className={ui.chip} style={chip}><SiGoogledocs color="#4285F4" aria-hidden="true" /> Documentos{active && docsOk ? ' ✓' : ''}</span>
            </div>

            {!st.app_configured && (
                <p className={ui.muted}>O Google ainda não está ativo neste servidor. {st.can_configure
                    ? 'Peça ao suporte do Cadrius para ativar, ou cadastre o app do Google do escritório em "Avançado".'
                    : 'Peça ao dono ou administrador do escritório.'}</p>
            )}
            {st.app_configured && !st.connected && (
                <p className={ui.muted}>Clique em conectar, escolha sua conta e autorize. O Cadrius passa a criar e ler seus compromissos,
                    exportar listas para Planilhas e salvar minutas no Docs. No Drive, ele só enxerga os arquivos que ele mesmo criar.</p>
            )}
            {active && !docsOk && (
                <p className={ui.muted}>Sua conexão é de antes de Planilhas e Documentos. Clique em <strong>Reconectar</strong> e aceite o novo acesso.</p>
            )}

            {st.app_configured && (
                <div className={ui.btn_row}>
                    {(!st.connected || st.status === 'needs_reauth' || (active && !docsOk)) && (
                        <button type="button" className={`${ui.btn} ${ui.btn_primary}`} disabled={busy} onClick={connect}>
                            {st.connected ? 'Reconectar' : 'Conectar Google'}</button>
                    )}
                    {active && <button type="button" className={ui.btn} disabled={busy} onClick={() => run(gcal.syncNow, 'Sincronizado.').then(load)}>Sincronizar agora</button>}
                    {st.connected && <button type="button" className={`${ui.btn} ${ui.btn_ghost}`} disabled={busy} onClick={() => run(gcal.disconnect, 'Desconectado.').then(load)}>Desconectar</button>}
                </div>
            )}
            {active && <AgendaGoogleEvents status={st} onSaved={load} />}

            {st.can_configure && (
                <details>
                    <summary style={{ cursor: 'pointer' }} className={ui.muted}>Avançado: privacidade dos eventos e app próprio do escritório</summary>
                    <div className={ui.stack} style={{ marginTop: 10 }}>
                        <label className={ui.check_row}><input type="checkbox" checked={form.share_details} onChange={(e) => setForm({ ...form, share_details: e.target.checked })} /> Enviar título e descrição das tarefas ao Google (desmarcado: a tarefa sai só como "Tarefa Cadrius")</label>
                        <label className={ui.field}>Duração padrão do evento de tarefa (minutos)<input style={{ ...input, maxWidth: 160 }} type="number" min="5" max="480" value={form.event_minutes} onChange={(e) => setForm({ ...form, event_minutes: e.target.value })} /></label>
                        {st.app_configured && <div><button type="button" className={ui.btn} disabled={busy} onClick={savePrefs}>Salvar preferências</button></div>}
                        <form onSubmit={saveApp} className={ui.stack} style={{ borderTop: '1px solid var(--c-border)', paddingTop: 10 }}>
                            <strong>App próprio do Google (opcional)</strong>
                            <span className={ui.muted} style={{ fontSize: '.85rem' }}>Para escritórios com Google Workspace que querem um app interno. Se cadastrar, quem já conectou precisa reconectar.</span>
                            <ol style={{ fontSize: '0.85rem', color: 'var(--c-text-2)', paddingLeft: 18 }}>
                                <li>No <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">Google Cloud</a>, ative Google Calendar API, Google Sheets API e Google Docs API.</li>
                                <li>Tela de permissão OAuth: <strong>Interno</strong> (Workspace); escopos <code style={{ wordBreak: 'break-all' }}>{st.scope}</code>.</li>
                                <li>ID do cliente OAuth (aplicativo da Web) com o URI de redirecionamento <code style={{ wordBreak: 'break-all' }}>{st.redirect_uri}</code></li>
                            </ol>
                            <label>ID do cliente<input style={input} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} placeholder="123…apps.googleusercontent.com" required /></label>
                            <label>Segredo do cliente {st.own_app && <small>(deixe em branco para manter o atual)</small>}<input style={input} type="password" autoComplete="off" value={form.client_secret} onChange={(e) => setForm({ ...form, client_secret: e.target.value })} required={!st.own_app} /></label>
                            <div><button type="submit" className={ui.btn} disabled={busy}>Salvar app do escritório</button></div>
                        </form>
                    </div>
                </details>
            )}
        </section>
    );
}
