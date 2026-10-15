import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { SiGoogle, SiGooglecalendar, SiGooglesheets, SiGoogledocs } from 'react-icons/si';
import { gcal, gcalResult, GCAL_STATUS_LABEL } from '../../services/gcal';
import { errorMessage } from '../../utils/format';
import ui from '../ui/ui.module.css';
import s from './Integracoes.module.css';
import { Button, Checkbox, Field, Input, Row, Stack } from '../ui';
import AgendaGoogleEvents from './AgendaGoogleEvents';

// CAD-230: uma conexão Google só (Agenda + Planilhas + Documentos). Com o app do Cadrius no servidor, a pessoa só clica em
// "Conectar Google"; o app próprio do escritório continua possível em "Avançado".
export default function GoogleCalendarCard({ embedded = false }) {
    const [st, setSt] = useState(null);
    const [form, setForm] = useState({ client_id: '', client_secret: '', share_details: true, event_minutes: 30 });
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => gcal.status().then((x) => {
        setSt(x);
        setForm((f) => ({ ...f, client_id: x.client_id || '', share_details: x.share_details, event_minutes: x.event_minutes }));
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
        <Stack as="section" aria-label="Google" className={embedded ? '' : ui.card}>
            {/* Dentro da janela de Integrações o título já aparece no topo; fora dela, o cartão mostra o próprio cabeçalho */}
            {!embedded && (
                <Row gap={3} wrap={false}>
                    <span aria-hidden="true" className={s.logo_box}><SiGoogle size={22} color="#4285F4" /></span>
                    <div className={ui.flex_1}>
                        <h2 className={`${ui.section_title} ${ui.mb_0}`}>Google: Agenda, Planilhas e Documentos</h2>
                        <span className={ui.muted}>
                            {active ? `Conectado${st.google_email ? ` como ${st.google_email}` : ''}`
                                : st.connected ? GCAL_STATUS_LABEL[st.status] : 'Uma conexão só para tudo do Google'}
                            {st.last_sync_at && active && <> · sincronizado {new Date(st.last_sync_at).toLocaleString('pt-BR')}</>}
                        </span>
                    </div>
                </Row>
            )}

            {embedded && <span className={ui.muted}>{active ? `Conectado${st.google_email ? ` como ${st.google_email}` : ''}` : 'Uma conexão só, na sua própria conta Google'}</span>}
            <Row>
                <span className={ui.chip}><SiGooglecalendar color="#1a73e8" aria-hidden="true" /> Agenda: ler, criar e alterar{active ? ' ✓' : ''}</span>
                <span className={ui.chip}><SiGooglesheets color="#0f9d58" aria-hidden="true" /> Planilhas{active && docsOk ? ' ✓' : ''}</span>
                <span className={ui.chip}><SiGoogledocs color="#4285F4" aria-hidden="true" /> Documentos{active && docsOk ? ' ✓' : ''}</span>
            </Row>

            {!st.app_configured && (
                <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>O Google ainda não está ativo neste servidor. {st.can_configure
                    ? 'Peça ao suporte do Cadrius para ativar, ou cadastre o app do Google do escritório em "Avançado".'
                    : 'Peça ao dono ou administrador do escritório.'}</p>
            )}
            {st.app_configured && !st.connected && (
                <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>Clique em conectar, escolha sua conta e autorize. O Cadrius passa a criar e ler seus compromissos,
                    exportar listas para Planilhas e salvar minutas no Docs. No Drive, ele só enxerga os arquivos que ele mesmo criar.</p>
            )}
            {active && (
                <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>Carteira de clientes organizada em pastas no Drive? <Link to="/importar?tipo=pastas">Importe as
                    pastas</Link>: cada pasta vira um cliente com os documentos dele.</p>
            )}
            {active && !docsOk && (
                <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>Sua conexão é de antes de Planilhas e Documentos. Clique em <strong>Reconectar</strong> e aceite o novo acesso.</p>
            )}

            {st.app_configured && (
                <Row>
                    {(!st.connected || st.status === 'needs_reauth' || (active && !docsOk)) && (
                        <Button variant="primary" loading={busy} onClick={connect}>{st.connected ? 'Reconectar' : 'Conectar Google'}</Button>
                    )}
                    {active && <Button disabled={busy} onClick={() => run(gcal.syncNow, 'Sincronizado.').then(load)}>Sincronizar agora</Button>}
                    {st.connected && <Button variant="ghost" disabled={busy} onClick={() => run(gcal.disconnect, 'Desconectado.').then(load)}>Desconectar</Button>}
                </Row>
            )}
            {active && <AgendaGoogleEvents status={st} onSaved={load} />}

            {st.can_configure && (
                <details>
                    <summary className={`${ui.muted} ${ui.clickable}`}>Avançado: privacidade dos eventos e app próprio do escritório</summary>
                    <Stack gap={3} className={ui.mt_3}>
                        <Checkbox checked={form.share_details} onChange={(e) => setForm({ ...form, share_details: e.target.checked })}>
                            Enviar título e descrição das tarefas ao Google (desmarcado: a tarefa sai só como "Tarefa Cadrius")
                        </Checkbox>
                        <Field label="Duração padrão do evento de tarefa (minutos)">
                            <Input className={s.field_narrow} type="number" min="5" max="480" value={form.event_minutes} onChange={(e) => setForm({ ...form, event_minutes: e.target.value })} />
                        </Field>
                        {st.app_configured && <Button className={ui.w_fit} disabled={busy} onClick={savePrefs}>Salvar preferências</Button>}
                        <Stack as="form" gap={3} onSubmit={saveApp} className={s.divider_top}>
                            <strong>App próprio do Google (opcional)</strong>
                            <span className={ui.muted}>Para escritórios com Google Workspace que querem um app interno. Se cadastrar, quem já conectou precisa reconectar.</span>
                            <ol className={s.guide}>
                                <li>No <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">Google Cloud</a>, ative Google Calendar API, Google Sheets API e Google Docs API.</li>
                                <li>Tela de permissão OAuth: <strong>Interno</strong> (Workspace); escopos <code className={ui.break_all}>{st.scope}</code>.</li>
                                <li>ID do cliente OAuth (aplicativo da Web) com o URI de redirecionamento <code className={ui.break_all}>{st.redirect_uri}</code></li>
                            </ol>
                            <Field label="ID do cliente">
                                <Input value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} placeholder="123…apps.googleusercontent.com" required />
                            </Field>
                            <Field label="Segredo do cliente" hint={st.own_app ? 'Deixe em branco para manter o atual.' : undefined}>
                                <Input type="password" autoComplete="off" value={form.client_secret} onChange={(e) => setForm({ ...form, client_secret: e.target.value })} required={!st.own_app} />
                            </Field>
                            <Button type="submit" className={ui.w_fit} disabled={busy}>Salvar app do escritório</Button>
                        </Stack>
                    </Stack>
                </details>
            )}
        </Stack>
    );
}
