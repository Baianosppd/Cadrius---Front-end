import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiX, FiZap } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import s from './MediaStudio.module.css';
import m from './Marketing.module.css';
import { Button, Field, Pill, Row, Segmented, Select, Stack, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
import { ART_STYLES, IMAGE_SOURCE, MAX_REFS } from '../../services/marketing';
import { mediaAddon } from '../../services/billing';

const MODES = [{ id: 'arte', label: 'Arte pronta' }, { id: 'foto', label: 'Fotos' }, { id: 'ia', label: 'Com IA', icon: FiZap }];
const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function StylePicker({ value, onChange, brand }) {
    return (
        <div className={s.styles} role="group" aria-label="Modelo da arte">
            {ART_STYLES.map(([k, label, desc]) => (
                <button key={k} type="button" className={s.style} aria-pressed={value === k} onClick={() => onChange(k)} title={desc}>
                    {/* A cor da marca vem do escritório: variável inline */}
                    <span className={`${s.mini} ${s[`m_${k}`]}`} style={{ '--brand': brand }} aria-hidden="true">
                        {k === 'citacao' && <b>“</b>}{k === 'dica' && <span />}<i /><i />
                    </span>
                    <strong>{label}</strong>
                </button>
            ))}
        </div>
    );
}

// Fotos do escritório: subir, escolher (uma ou várias) e apagar
function Gallery({ api, photos, setPhotos, selected, onToggle, multi = false, disabled }) {
    const input = useRef(null);
    const [busy, setBusy] = useState(false);
    const pick = async (e) => {
        const files = [...(e.target.files || [])].slice(0, 6);
        e.target.value = '';
        if (!files.length) return;
        setBusy(true);
        try {
            const added = [];
            for (const f of files) added.push(await api.uploadPhoto(f));
            setPhotos((list) => [...added, ...list]);
            if (!multi && added[0]) onToggle(added[0].id);
            toast.success(added.length > 1 ? `${added.length} fotos enviadas.` : 'Foto enviada.');
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const remove = async (ph) => {
        if (!window.confirm('Apagar esta foto da galeria? Os posts que já usam a imagem continuam.')) return;
        try { await api.removePhoto(ph.id); setPhotos((list) => list.filter((x) => x.id !== ph.id)); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <div className={s.gallery}>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={pick} />
            <button type="button" className={s.add} disabled={busy || disabled} onClick={() => input.current?.click()}>
                <FiPlus size={18} aria-hidden="true" />{busy ? 'Enviando…' : 'Subir foto'}
            </button>
            {photos.map((ph) => {
                const idx = selected.indexOf(ph.id);
                return (
                    <div key={ph.id} className={s.thumb_wrap}>
                        <button type="button" className={s.thumb} aria-pressed={idx >= 0} onClick={() => onToggle(ph.id)} title={ph.nome}>
                            <img src={ph.url} alt={ph.nome || 'Foto do escritório'} loading="lazy" />
                            {multi && idx >= 0 && <span className={s.badge}>{idx + 1}</span>}
                        </button>
                        <button type="button" className={s.del} aria-label={`Apagar ${ph.nome || 'foto'}`} onClick={() => remove(ph)}><FiX size={13} /></button>
                    </div>
                );
            })}
        </div>
    );
}

function Upsell({ addon }) {
    const [busy, setBusy] = useState(false);
    const buy = async () => { setBusy(true); try { await mediaAddon.checkout(); } catch (err) { toast.error(errorMessage(err)); setBusy(false); } };
    return (
        <div className={s.upsell}>
            <strong><FiZap aria-hidden="true" /> Estúdio de mídia com IA</strong>
            <ul>{(addon?.recursos || ['Imagens com IA', 'Vídeos curtos com IA', 'Suas fotos como referência']).map((r) => <li key={r}>{r}</li>)}</ul>
            <span className={`${styles.muted} ${styles.text_xs}`}>Incluído no plano Enterprise. Nos outros planos, é um adicional mensal.
                As imagens e vídeos usam créditos de IA.</span>
            {addon?.pode_gerenciar && addon?.pode_contratar ? (
                <Row>
                    <span className={s.price}>{brl(addon.preco)}<small className={styles.muted}>/mês</small></span>
                    <Button variant="primary" loading={busy} loadingLabel="Abrindo pagamento…" onClick={buy}>Contratar adicional</Button>
                </Row>
            ) : <span className={`${styles.muted} ${styles.text_xs}`}>Peça ao dono ou administrador do escritório para contratar.</span>}
        </div>
    );
}

// Vídeo curto com IA (Gemini Veo): pede, acompanha o andamento e mostra quando fica pronto
function VideoBlock({ api, p, onPiece, photos, disabled }) {
    const [hint, setHint] = useState('');
    const [photo, setPhoto] = useState(null);
    const [busy, setBusy] = useState(false);
    const poll = useCallback(() => api.video(p.id).then(onPiece).catch(() => {}), [api, p.id, onPiece]);
    useEffect(() => {
        if (p.video_status !== 'gerando') return undefined;
        const t = setInterval(poll, 10000);
        return () => clearInterval(t);
    }, [p.video_status, poll]);
    const start = async () => {
        setBusy(true);
        try { onPiece(await api.startVideo(p.id, { sugestao: hint, foto_id: photo })); toast.info('Vídeo pedido. Leva de 1 a 6 minutos; pode continuar usando o Cadrius.'); }
        catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <Stack gap={2} className={m.video_block}>
            <strong>Vídeo curto (Reels/Shorts)</strong>
            {p.video_status === 'pronto' && p.video_url && (
                <>
                    <video className={s.video} src={p.video_url} controls playsInline preload="metadata"><track kind="captions" /></video>
                    <Button as="a" size="sm" className={styles.w_fit} href={p.video_url} download target="_blank" rel="noopener noreferrer">Baixar vídeo</Button>
                </>
            )}
            {p.video_status === 'gerando' ? (
                <div className={s.spinner_row} role="status"><span className={s.dot} /> Gerando o vídeo no Gemini… a tela atualiza sozinha.</div>
            ) : (
                <>
                    {p.video_status === 'falhou' && <span className={`${styles.text_danger} ${styles.text_sm}`}>{p.video_erro}</span>}
                    <Textarea rows={2} maxLength={500} value={hint} onChange={(e) => setHint(e.target.value)}
                        aria-label="Cena do vídeo" placeholder="Cena do vídeo. Ex.: advogada explicando em escritório claro, câmera lenta" />
                    {photos.length > 0 && (
                        <Field label="Começar a partir de uma foto (opcional)">
                            <Select value={photo || ''} onChange={(e) => setPhoto(e.target.value ? Number(e.target.value) : null)}>
                                <option value="">— sem foto —</option>
                                {photos.map((ph) => <option key={ph.id} value={ph.id}>{ph.nome || `Foto ${ph.id}`}</option>)}
                            </Select>
                        </Field>
                    )}
                    <Button className={styles.w_fit} disabled={disabled} loading={busy} loadingLabel="Pedindo…" onClick={start}>
                        {p.video_status === 'pronto' ? 'Gerar outro vídeo' : 'Gerar vídeo com IA'}</Button>
                </>
            )}
        </Stack>
    );
}

// Imagem (e vídeo) do post — CAD-231. Arte pronta e fotos: todos os planos. IA: adicional de mídia (ou Enterprise).
export default function MediaStudio({ api, p, hint, setHint, brandColor, onPiece, disabled, addon }) {
    const [mode, setMode] = useState(p.video_status === 'gerando' ? 'ia' : 'arte');
    const [style, setStyle] = useState('destaque');
    const [photos, setPhotos] = useState([]);
    const [chosen, setChosen] = useState(null);
    const [refs, setRefs] = useState([]);
    const [busy, setBusy] = useState('');
    useEffect(() => { api.photos().then(setPhotos).catch(() => {}); }, [api]);
    const iaOn = !!addon?.ativo;

    const run = async (key, body) => {
        setBusy(key);
        try {
            const x = await api.image(p.id, body);
            onPiece(x);
            if (x.aviso) toast.info(x.aviso); else toast.success('Imagem pronta.');
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(''); }
    };
    const toggleRef = (id) => setRefs((r) => (r.includes(id) ? r.filter((x) => x !== id) : r.length >= MAX_REFS ? r : [...r, id]));
    const needPhoto = mode === 'foto' || (mode === 'arte' && style === 'foto');
    const pickOne = (id) => setChosen(id === chosen ? null : id);

    return (
        <Stack gap={3} className={`${styles.card} ${styles.bg_soft}`}>
            <Row gap={2} className={`${styles.section_title} ${styles.mb_0}`}>
                Imagem do post {p.imagem_origem && <Pill tone={p.imagem_origem === 'marca' || p.imagem_origem === 'foto' ? 'gray' : 'blue'}>{IMAGE_SOURCE[p.imagem_origem] || p.imagem_origem}</Pill>}
            </Row>
            <Segmented options={MODES} value={mode} onChange={setMode} aria-label="Como criar a imagem" />

            {mode === 'arte' && (
                <Stack gap={3}>
                    <StylePicker value={style} onChange={setStyle} brand={brandColor} />
                    {style === 'foto' && <Gallery api={api} photos={photos} setPhotos={setPhotos} selected={chosen ? [chosen] : []} onToggle={pickOne} disabled={disabled} />}
                    <Button variant="primary" className={styles.w_fit} disabled={!!busy || disabled || (needPhoto && !chosen)} loading={busy === 'arte'} loadingLabel="Montando…"
                        onClick={() => run('arte', { modo: 'marca', estilo: style, foto_id: style === 'foto' ? chosen : null })}>Usar esta arte</Button>
                    <span className={`${styles.muted} ${styles.text_xs}`}>Com a cor e a logo do escritório. Sem custo.</span>
                </Stack>
            )}

            {mode === 'foto' && (
                <Stack gap={3}>
                    <Gallery api={api} photos={photos} setPhotos={setPhotos} selected={chosen ? [chosen] : []} onToggle={pickOne} disabled={disabled} />
                    <Button variant="primary" className={styles.w_fit} disabled={!!busy || disabled || !chosen} loading={busy === 'foto'} loadingLabel="Preparando…"
                        onClick={() => run('foto', { modo: 'foto', foto_id: chosen })}>Usar a foto no post</Button>
                    <span className={`${styles.muted} ${styles.text_xs}`}>JPEG, PNG ou WebP até 8 MB.</span>
                </Stack>
            )}

            {mode === 'ia' && !iaOn && <Upsell addon={addon} />}
            {mode === 'ia' && iaOn && (
                <Stack gap={3}>
                    <Field label="O que a imagem deve mostrar">
                        <Textarea rows={2} maxLength={500} value={hint} onChange={(e) => setHint(e.target.value)}
                            placeholder="Ex.: balança da justiça sobre mesa de madeira, luz natural" />
                    </Field>
                    <div className={styles.field}>Fotos de referência (até {MAX_REFS}, opcional)</div>
                    <Gallery api={api} photos={photos} setPhotos={setPhotos} selected={refs} onToggle={toggleRef} multi disabled={disabled} />
                    <Button variant="primary" className={styles.w_fit} disabled={!!busy || disabled} loading={busy === 'ia'} loadingLabel="Gerando a imagem…"
                        onClick={() => run('ia', { modo: 'ia', sugestao_imagem: hint, referencias: refs })}>
                        {p.imagem_url ? 'Gerar outra com IA' : 'Gerar imagem com IA'}</Button>
                    <VideoBlock api={api} p={p} onPiece={onPiece} photos={photos} disabled={disabled} />
                </Stack>
            )}
        </Stack>
    );
}
