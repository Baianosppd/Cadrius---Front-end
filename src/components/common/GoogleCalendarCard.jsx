import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { gcal, gcalResult, GCAL_STATUS_LABEL } from '../../services/gcal';
import { errorMessage } from '../seguranca/ui';
import ui from '../seguranca/seguranca.module.css';

const input = { width: '100%', padding: 8, border: '1px solid var(--c-border-2)', borderRadius: 6 };

// Cada escritório usa o PRÓPRIO app OAuth do Google (sem verificação do Google para o Cadrius). Passo a passo: deploy/README.md §12.
export default function GoogleCalendarCard() {
    const [st, setSt] = useState(null);
    const [form, setForm] = useState({ client_id: '', client_secret: '', share_details: true, event_minutes: 30 });
    const [showSetup, setShowSetup] = useState(false);
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
        if (await run(() => gcal.saveApp(body), 'Credenciais salvas.')) { setForm((f) => ({ ...f, client_secret: '' })); setShowSetup(false); load(); }
    };
    const connect = async () => { const r = await run(gcal.connect); if (r?.authorization_url) window.location.href = r.authorization_url; };

    return (
        <section aria-label="Google Calendar" className={`${ui.card} ${ui.stack}`}>
            <h2 className={ui.section_title}>Google Calendar — prazos e tarefas na sua agenda</h2>
            {!st.app_configured ? (
                <p>Cada escritório usa o <strong>próprio app do Google</strong> (nada é compartilhado com outros clientes).
                    {st.can_configure ? ' Siga o passo a passo abaixo e cadastre as credenciais.' : ' Peça ao dono ou administrador do escritório para configurar.'}</p>
            ) : (
                <p>Estado: <strong>{st.connected ? GCAL_STATUS_LABEL[st.status] : 'Não conectado'}</strong>
                    {st.last_sync_at && <> · última sincronização {new Date(st.last_sync_at).toLocaleString('pt-BR')}</>}
                    {st.last_error && <span style={{ color: '#b91c1c' }}> · {st.last_error}</span>}</p>
            )}
            {st.app_configured && (
                <div className={ui.btn_row}>
                    {(!st.connected || st.status === 'needs_reauth') && <button disabled={busy} onClick={connect}>{st.connected ? 'Reconectar' : 'Conectar minha agenda'}</button>}
                    {st.connected && st.status === 'active' && <button disabled={busy} onClick={() => run(gcal.syncNow, 'Sincronizado.').then(load)}>Sincronizar agora</button>}
                    {st.connected && <button disabled={busy} onClick={() => run(gcal.disconnect, 'Desconectado.').then(load)}>Desconectar</button>}
                </div>
            )}
            {st.can_configure && (
                <>
                    <p><button type="button" onClick={() => setShowSetup((v) => !v)}>{showSetup ? 'Fechar configuração' : (st.app_configured ? 'Editar credenciais do app' : 'Configurar app do Google')}</button></p>
                    {showSetup && (
                        <form onSubmit={saveApp} style={{ display: 'grid', gap: 10 }}>
                            <ol style={{ fontSize: '0.85rem', color: 'var(--c-text-2)', paddingLeft: 18 }}>
                                <li>No <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">Google Cloud</a>, crie um projeto e ative a <strong>Google Calendar API</strong>.</li>
                                <li>Tela de permissão OAuth: <strong>Interno</strong> (Workspace) ou <strong>Externo em Teste</strong> com seus e-mails; escopo <code>{st.scope}</code>.</li>
                                <li>Credenciais → ID do cliente OAuth (aplicativo da Web) com este <strong>URI de redirecionamento</strong>:<br /><code style={{ wordBreak: 'break-all' }}>{st.redirect_uri}</code></li>
                                <li>Cole abaixo o ID e o segredo do cliente.</li>
                            </ol>
                            <label>ID do cliente<input style={input} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} placeholder="123…apps.googleusercontent.com" required /></label>
                            <label>Segredo do cliente {st.app_configured && <small>(deixe em branco para manter o atual)</small>}<input style={input} type="password" autoComplete="off" value={form.client_secret} onChange={(e) => setForm({ ...form, client_secret: e.target.value })} required={!st.app_configured} /></label>
                            <label><input type="checkbox" checked={form.share_details} onChange={(e) => setForm({ ...form, share_details: e.target.checked })} /> Enviar título e descrição da tarefa ao Google (desmarcado: o evento sai só como "Tarefa Cadrius")</label>
                            <label>Duração padrão do evento (minutos)<input style={input} type="number" min="5" max="480" value={form.event_minutes} onChange={(e) => setForm({ ...form, event_minutes: e.target.value })} /></label>
                            <div><button type="submit" disabled={busy}>Salvar credenciais</button></div>
                        </form>
                    )}
                </>
            )}
        </section>
    );
}
