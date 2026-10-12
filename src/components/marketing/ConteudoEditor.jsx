import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import m from './Marketing.module.css';
import { Banner, Button, Checkbox, Field, Input, Modal, Pill, Stack, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
import { AUTO_CHANNELS, CHANNEL_LABEL, LEVEL_TONE, STATUS, parseHashtags, toLocalInput } from '../../services/marketing';
import PostPreview from './PostPreview';
import MediaStudio from './MediaStudio';
import AIWriteMenu from '../assistant/AIWriteMenu';

// Alertas do verificador OAB (Provimento 205/2021)
function Alertas({ alertas }) {
    if (!alertas?.length) return <Banner tone="ok">Nenhum alerta encontrado pelo verificador.</Banner>;
    return (
        <Stack gap={2}>
            {alertas.map((a, i) => (
                <div key={i} className={styles.text_sm}>
                    <Pill tone={LEVEL_TONE[a.nivel] || 'gray'}>{a.nivel}</Pill> <strong>{a.regra}</strong>
                    {a.trecho && <span className={styles.muted}> — "{a.trecho}"</span>}
                    <div className={styles.muted}>{a.sugestao}</div>
                </div>
            ))}
        </Stack>
    );
}

// Editor de um conteúdo: texto, verificador ao vivo, imagem, agenda e ações de aprovação/publicação
export default function ConteudoEditor({ api, id, canApprove, onClose, onChanged, brand, addon }) {
    const [p, setP] = useState(null);
    const [form, setForm] = useState(null);
    const [alertas, setAlertas] = useState(null);
    const [revisei, setRevisei] = useState(false);
    const [busy, setBusy] = useState(false);
    const [hint, setHint] = useState('');
    const timer = useRef(null);
    useEffect(() => {
        api.get(id).then((x) => {
            setP(x);
            setHint(x.sugestao_imagem || '');
            setAlertas(x.alertas);
            setForm({ titulo: x.titulo, texto: x.texto, hashtags: (x.hashtags || []).map((t) => `#${t}`).join(' '), imagem_url: x.imagem_url, agendado_para: toLocalInput(x.agendado_para) });
        }).catch((err) => toast.error(errorMessage(err)));
    }, [api, id]);
    const setText = (texto) => {
        setForm((f) => ({ ...f, texto }));
        clearTimeout(timer.current);
        timer.current = setTimeout(() => api.check(texto, p.canal).then((r) => setAlertas(r.alertas)).catch(() => {}), 600);
    };
    if (!p || !form) return null;
    const blocking = (alertas || []).some((a) => a.nivel === 'alto');
    const save = async (extra = {}, ok = 'Salvo.') => {
        setBusy(true);
        try {
            const body = { titulo: form.titulo, texto: form.texto, hashtags: parseHashtags(form.hashtags), imagem_url: form.imagem_url,
                agendado_para: form.agendado_para ? new Date(form.agendado_para).toISOString() : null, ...extra };
            if (blocking && revisei) body.revisei_alertas = true;
            const x = await api.update(p.id, body);
            setP(x); setAlertas(x.alertas); toast.success(ok); onChanged();
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const onPiece = (x) => {
        setP((old) => ({ ...old, ...x }));
        setForm((f) => ({ ...f, imagem_url: x.imagem_url }));
        onChanged();
    };
    const publishNow = async () => {
        setBusy(true);
        try { const x = await api.publish(p.id); setP(x); toast.success('Publicado.'); onChanged(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const copy = async () => {
        const tags = parseHashtags(form.hashtags).map((t) => `#${t}`).join(' ');
        try { await navigator.clipboard.writeText(tags ? `${form.texto}\n\n${tags}` : form.texto); toast.success('Texto copiado. Cole no app do canal.'); }
        catch { toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.'); }
    };
    const [label, tone] = STATUS[p.status] || [p.status, 'gray'];
    const auto = AUTO_CHANNELS.includes(p.canal);
    const travado = busy || (blocking && !revisei);
    return (
        // Editor com texto: clique fora não fecha (Esc e "Fechar" fecham)
        <Modal size="xl" onClose={onClose} busy={busy} closeOnOverlay={false}
            title={<>{CHANNEL_LABEL[p.canal]} <Pill tone={tone}>{label}</Pill> {p.ia && <Pill tone="blue">IA</Pill>}</>}
            footer={<>
                {p.status !== 'publicado' && <Button disabled={busy} onClick={() => save()}>Salvar</Button>}
                <Button onClick={copy}>Copiar texto</Button>
                {canApprove && p.status === 'rascunho' && (
                    <Button variant="primary" disabled={travado} onClick={() => save({ status: 'aprovado' }, 'Aprovado.')}>Aprovar</Button>
                )}
                {canApprove && ['rascunho', 'aprovado'].includes(p.status) && (
                    <Button variant="primary" disabled={travado || !form.agendado_para} onClick={() => save({ status: 'agendado' }, 'Agendado.')}>Agendar</Button>
                )}
                {canApprove && auto && ['aprovado', 'agendado', 'falhou'].includes(p.status) && (
                    <Button disabled={busy} onClick={publishNow}>Publicar agora</Button>
                )}
                {canApprove && !auto && ['aprovado', 'agendado'].includes(p.status) && (
                    <Button disabled={busy} onClick={() => save({ status: 'publicado' }, 'Marcado como publicado.')}>Já publiquei</Button>
                )}
                <Button onClick={onClose} disabled={busy}>Fechar</Button>
                <Button variant="danger" className={styles.ml_auto}
                    onClick={() => window.confirm('Excluir este conteúdo?') && api.remove(p.id).then(() => { onChanged(); onClose(); })}>Excluir</Button>
            </>}>
            {p.erro && <Banner tone="warn">{p.erro}</Banner>}
            <div className={styles.two_col}>
                <Stack>
                    <Field label="Título / primeira linha">
                        <Input value={form.titulo} maxLength={200} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                    </Field>
                    <Field label="Texto">
                        <Textarea className={m.texto} value={form.texto} onChange={(e) => setText(e.target.value)} />
                    </Field>
                    <AIWriteMenu value={form.texto} onApply={setText} actions={['corrigir', 'simples', 'resumir']} />
                    <div className={`${styles.muted} ${styles.text_xs} ${styles.text_right}`}>{form.texto.length} caracteres</div>
                    {['instagram', 'facebook', 'linkedin'].includes(p.canal) && (
                        <Field label="Hashtags (até 8)">
                            <Input value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} placeholder="#direitodoconsumidor #cdc" />
                        </Field>
                    )}
                </Stack>
                <Stack>
                    <div className={`${styles.card} ${styles.bg_soft}`}>
                        <div className={styles.section_title}>Verificador OAB</div>
                        <Alertas alertas={alertas} />
                        {blocking && canApprove && (
                            <Checkbox className={styles.mt_3} checked={revisei} onChange={(e) => setRevisei(e.target.checked)}>
                                Revisei os alertas e assumo a responsabilidade pelo texto
                            </Checkbox>
                        )}
                    </div>
                    <MediaStudio api={api} p={p} hint={hint} setHint={setHint} brandColor="var(--c-primary-solid)" addon={addon}
                        disabled={p.status === 'publicado'} onPiece={onPiece} />
                    {p.canal === 'video_curto' && !addon?.ativo && (
                        <p className={`${styles.muted} ${styles.text_xs}`}>Vídeo: o Cadrius entrega o roteiro com as cenas. Monte no CapCut, Canva ou
                            Instagram Edits, ou gere o vídeo com IA no Estúdio de mídia (adicional).</p>
                    )}
                    {auto && (
                        <details>
                            <summary className={`${styles.muted} ${m.summary}`}>Usar o link de uma imagem (https){p.canal === 'instagram' && ' · o Instagram exige imagem'}</summary>
                            <Input className={styles.mt_2} aria-label="Link da imagem" value={form.imagem_url}
                                onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="https://…" />
                        </details>
                    )}
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Como vai aparecer</div>
                    <PostPreview channel={p.canal} brand={brand} title={form.titulo} text={form.texto} hashtags={form.hashtags}
                        image={form.imagem_url} hint={p.sugestao_imagem} />
                    <Field label="Data e hora da publicação"
                        hint={auto ? 'Facebook e Instagram publicam sozinhos na hora agendada (com a conexão Meta em Integrações).'
                            : 'Este canal não publica sozinho: na hora agendada você recebe um lembrete e publica com o texto copiado.'}>
                        <Input type="datetime-local" value={form.agendado_para} onChange={(e) => setForm({ ...form, agendado_para: e.target.value })} />
                    </Field>
                </Stack>
            </div>
        </Modal>
    );
}
