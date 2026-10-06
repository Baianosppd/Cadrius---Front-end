import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, StatusPill, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import useLoader from '../gestao/useLoader';
import useAuth from '../../hooks/useAuth';
import { MinhasParametrizacoes, NovaParametrizacao } from '../../components/suporte/Parametrizacao';
import { CATEGORIES, STATUS, isActive, supportApi, ticketBody } from '../../services/support';

export function Conversa({ messages, staffView = false }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m) => (
                <div key={m.id} className={styles.card} style={{ padding: 12, alignSelf: m.from_staff === staffView ? 'flex-end' : 'flex-start', maxWidth: '80%',
                    background: m.internal ? '#fffbeb' : (m.from_staff ? '#eff6ff' : '#fff') }}>
                    <div className={styles.muted} style={{ fontSize: '.78rem' }}>{m.internal ? 'Nota interna · ' : ''}{m.author || (m.from_staff ? 'Equipe Cadrius' : 'Você')} · {fmtDateTime(m.created_at)}</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
                </div>
            ))}
        </div>
    );
}

function Chamado({ id, onBack }) {
    const { data, error, reload } = useLoader(() => supportApi.get(id), [id]);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const act = async (fn, ok) => {
        setBusy(true);
        try { await fn(); if (ok) toast.success(ok); setText(''); reload(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    return (
        <div className={styles.page}>
            <PageHeader title={`#${data.id} · ${data.subject}`} subtitle={`${data.category_label} · aberto em ${fmtDateTime(data.created_at)}`}
                actions={<button type="button" className={styles.btn} onClick={onBack}>Voltar</button>} />
            <div className={styles.btn_row}><StatusPill map={STATUS} value={data.status} /></div>
            <Conversa messages={data.messages} />
            {data.status !== 'fechado' ? (
                <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <textarea className={styles.textarea} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua mensagem" />
                    <div className={styles.btn_row}>
                        <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || text.trim().length < 5} onClick={() => act(() => supportApi.reply(id, text.trim()))}>Enviar</button>
                        <button type="button" className={styles.btn} disabled={busy} onClick={() => act(() => supportApi.setStatus(id, 'close'), 'Chamado fechado.')}>Fechar chamado</button>
                    </div>
                </div>
            ) : (
                <div><button type="button" className={styles.btn} disabled={busy} onClick={() => act(() => supportApi.setStatus(id, 'reopen'), 'Chamado reaberto.')}>Reabrir</button></div>
            )}
            <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={styles.section_title} style={{ marginBottom: 0 }}>Acesso assistido</div>
                <p className={styles.muted}>A equipe Cadrius não vê os dados do seu escritório. Se o problema exigir, autorize o acesso só de leitura por tempo limitado; você pode revogar quando quiser.</p>
                {data.access_until ? (
                    <div className={styles.btn_row}><Banner tone="info">Acesso autorizado até {fmtDateTime(data.access_until)}.</Banner>
                        <button type="button" className={`${styles.btn} ${styles.btn_danger}`} disabled={busy} onClick={() => act(() => supportApi.revoke(id), 'Acesso revogado.')}>Revogar agora</button></div>
                ) : (
                    <div className={styles.btn_row}>
                        <button type="button" className={styles.btn} disabled={busy} onClick={() => act(() => supportApi.grant(id, 24), 'Acesso autorizado por 24 h.')}>Autorizar por 24 h</button>
                        <button type="button" className={styles.btn} disabled={busy} onClick={() => act(() => supportApi.grant(id, 72), 'Acesso autorizado por 72 h.')}>Autorizar por 72 h</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function NovoChamado({ onDone, onCancel, pageUrl }) {
    const [form, setForm] = useState({ subject: '', category: 'duvida', priority: 'normal', body: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const submit = async (e) => {
        e.preventDefault();
        const built = ticketBody(form, pageUrl);
        if (!built.ok) { setError(built.error); return; }
        setBusy(true);
        try { const t = await supportApi.open(built.body); toast.success('Chamado aberto. A equipe Cadrius vai responder por aqui.'); onDone(t.id); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <form className={styles.card} onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
            <div className={styles.section_title}>Novo chamado</div>
            <div className={styles.filters}>
                <label className={styles.field} style={{ flex: 2 }}>Assunto<input className={styles.input} value={form.subject} onChange={set('subject')} maxLength={200} /></label>
                <label className={styles.field}>Categoria<select className={styles.select} value={form.category} onChange={set('category')}>{CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                <label className={styles.field}>Prioridade<select className={styles.select} value={form.priority} onChange={set('priority')}><option value="normal">Normal</option><option value="alta">Alta (atrapalha o trabalho)</option></select></label>
            </div>
            <label className={styles.field}>O que aconteceu? (passos, mensagem de erro, o que esperava)<textarea className={styles.textarea} value={form.body} onChange={set('body')} /></label>
            {pageUrl && <p className={styles.muted}>Tela de origem: {pageUrl}</p>}
            <Banner tone="info">Não envie senhas nem dados de clientes na mensagem.</Banner>
            {error && <Banner tone="error">{error}</Banner>}
            <div className={styles.btn_row}>
                <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>Abrir chamado</button>
                <button type="button" className={styles.btn} onClick={onCancel}>Cancelar</button>
            </div>
        </form>
    );
}

export default function Suporte() {
    const [params, setParams] = useSearchParams();
    const current = params.get('chamado');
    const [creating, setCreating] = useState(params.get('novo') === '1' ? 'chamado' : params.get('parametrizacao') === '1' ? 'param' : null);
    const { data, error, reload } = useLoader(supportApi.list, [current]);
    const { isOrgManager } = useAuth();
    if (current) return <Chamado id={current} onBack={() => { setParams({}); reload(); }} />;
    const opened = (id) => { setCreating(null); setParams({ chamado: id }); };
    return (
        <div className={styles.page}>
            <PageHeader title="Suporte" subtitle="Fale com a equipe Cadrius ou peça uma parametrização específica"
                actions={!creating && (
                    <div className={styles.btn_row}>
                        <button type="button" className={styles.btn} onClick={() => setCreating('param')}>Pedir parametrização</button>
                        <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setCreating('chamado')}>Abrir chamado</button>
                    </div>
                )} />
            {creating === 'chamado' && <NovoChamado pageUrl={params.get('de') || ''} onCancel={() => setCreating(null)} onDone={opened} />}
            {creating === 'param' && <NovaParametrizacao pageUrl={params.get('de') || ''} onCancel={() => setCreating(null)} onDone={opened} />}
            {!creating && <MinhasParametrizacoes canApprove={isOrgManager} onOpen={(id) => setParams({ chamado: id })} />}
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Carregando…</Empty>}
            {data && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Chamado</th><th>Situação</th><th>Atualizado</th></tr></thead>
                        <tbody>
                            {data.length === 0 && <tr><td colSpan={3}><Empty title="Tudo certo por aqui">Nenhum chamado aberto. Quando precisar, a equipe Cadrius responde por aqui.</Empty></td></tr>}
                            {data.map((t) => (
                                <tr key={t.id} onClick={() => setParams({ chamado: t.id })} style={{ cursor: 'pointer', opacity: isActive(t.status) ? 1 : 0.6 }}>
                                    <td><strong>#{t.id} · {t.subject}</strong><div className={styles.muted}>{t.category_label}</div></td>
                                    <td><StatusPill map={STATUS} value={t.status} /></td>
                                    <td>{fmtDateTime(t.updated_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
