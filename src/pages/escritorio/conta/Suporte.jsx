import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../../components/ui/ui.module.css';
import s from '../../../components/suporte/Suporte.module.css';
import { Banner, Button, Empty, Field, FilterBar, Input, Loading, PageHeader, Row, Select, Stack, StatusPill, Table, Textarea } from '../../../components/ui';
import { errorMessage, fmtDateTime } from '../../../utils/format';
import useLoader from '../../../hooks/useLoader';
import useAuth from '../../../hooks/useAuth';
import Conversa from '../../../components/suporte/Conversa';
import { MinhasParametrizacoes, NovaParametrizacao } from '../../../components/suporte/Parametrizacao';
import { CATEGORIES, STATUS, isActive, supportApi, ticketBody } from '../../../services/support';

function Chamado({ id, onBack }) {
    const { data, error, reload } = useLoader(() => supportApi.get(id), [id]);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const act = async (fn, ok) => {
        setBusy(true);
        try { await fn(); if (ok) toast.success(ok); setText(''); reload(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <div className={styles.page}>
            <PageHeader title={`#${data.id} · ${data.subject}`} subtitle={`${data.category_label} · aberto em ${fmtDateTime(data.created_at)}`}
                actions={<Button onClick={onBack}>Voltar</Button>} />
            <Row><StatusPill map={STATUS} value={data.status} /></Row>
            <Conversa messages={data.messages} />
            {data.status !== 'fechado' ? (
                <Stack gap={3} className={styles.card}>
                    <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua mensagem" aria-label="Sua mensagem" />
                    <Row>
                        <Button variant="primary" disabled={busy || text.trim().length < 5} onClick={() => act(() => supportApi.reply(id, text.trim()))}>Enviar</Button>
                        <Button disabled={busy} onClick={() => act(() => supportApi.setStatus(id, 'close'), 'Chamado fechado.')}>Fechar chamado</Button>
                    </Row>
                </Stack>
            ) : (
                <Button className={styles.w_fit} disabled={busy} onClick={() => act(() => supportApi.setStatus(id, 'reopen'), 'Chamado reaberto.')}>Reabrir</Button>
            )}
            <Stack gap={2} className={styles.card}>
                <div className={`${styles.section_title} ${styles.mb_0}`}>Acesso assistido</div>
                <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>A equipe Cadrius não vê os dados do seu escritório. Se o problema exigir, autorize o acesso só de leitura por tempo limitado; você pode revogar quando quiser.</p>
                {data.access_until ? (
                    <Row>
                        <Banner tone="info">Acesso autorizado até {fmtDateTime(data.access_until)}.</Banner>
                        <Button variant="danger" disabled={busy} onClick={() => act(() => supportApi.revoke(id), 'Acesso revogado.')}>Revogar agora</Button>
                    </Row>
                ) : (
                    <Row>
                        <Button disabled={busy} onClick={() => act(() => supportApi.grant(id, 24), 'Acesso autorizado por 24 h.')}>Autorizar por 24 h</Button>
                        <Button disabled={busy} onClick={() => act(() => supportApi.grant(id, 72), 'Acesso autorizado por 72 h.')}>Autorizar por 72 h</Button>
                    </Row>
                )}
            </Stack>
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
        <Stack as="form" gap={3} className={`${styles.card} ${s.form}`} onSubmit={submit}>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Novo chamado</div>
            <FilterBar>
                <Field label="Assunto" className={styles.flex_2}><Input value={form.subject} onChange={set('subject')} maxLength={200} /></Field>
                <Field label="Categoria"><Select value={form.category} onChange={set('category')}>{CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
                <Field label="Prioridade"><Select value={form.priority} onChange={set('priority')}><option value="normal">Normal</option><option value="alta">Alta (atrapalha o trabalho)</option></Select></Field>
            </FilterBar>
            <Field label="O que aconteceu?" hint="Conte os passos, a mensagem de erro e o que você esperava.">
                <Textarea value={form.body} onChange={set('body')} />
            </Field>
            {pageUrl && <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Tela de origem: {pageUrl}</p>}
            <Banner tone="info">Não envie senhas nem dados de clientes na mensagem.</Banner>
            {error && <Banner tone="error">{error}</Banner>}
            <Row>
                <Button type="submit" variant="primary" loading={busy} loadingLabel="Enviando…">Abrir chamado</Button>
                <Button onClick={onCancel}>Cancelar</Button>
            </Row>
        </Stack>
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
    const open = (id) => setParams({ chamado: id });
    return (
        <div className={styles.page}>
            <PageHeader title="Suporte" subtitle="Fale com a equipe Cadrius"
                actions={!creating && (<>
                    <Button onClick={() => setCreating('param')}>Pedir parametrização</Button>
                    <Button variant="primary" onClick={() => setCreating('chamado')}>Abrir chamado</Button>
                </>)} />
            {creating === 'chamado' && <NovoChamado pageUrl={params.get('de') || ''} onCancel={() => setCreating(null)} onDone={opened} />}
            {creating === 'param' && <NovaParametrizacao pageUrl={params.get('de') || ''} onCancel={() => setCreating(null)} onDone={opened} />}
            {!creating && <MinhasParametrizacoes canApprove={isOrgManager} onOpen={open} />}
            {error && <Banner tone="error">{error}</Banner>}
            {!error && (
                <Table columns={['Chamado', 'Situação', 'Atualizado']} loading={!data}
                    empty={data?.length === 0 && <Empty title="Tudo certo por aqui">Nenhum chamado aberto. Quando precisar, a equipe Cadrius responde por aqui.</Empty>}>
                    {data?.map((t) => (
                        // Chamados fechados aparecem esmaecidos
                        <tr key={t.id} className={`${styles.clickable} ${isActive(t.status) ? '' : styles.text_muted}`} tabIndex={0}
                            onClick={() => open(t.id)} onKeyDown={(e) => e.key === 'Enter' && open(t.id)}>
                            <td><strong>#{t.id} · {t.subject}</strong><div className={styles.muted}>{t.category_label}</div></td>
                            <td data-label="Situação"><StatusPill map={STATUS} value={t.status} /></td>
                            <td data-label="Atualizado">{fmtDateTime(t.updated_at)}</td>
                        </tr>
                    ))}
                </Table>
            )}
        </div>
    );
}
