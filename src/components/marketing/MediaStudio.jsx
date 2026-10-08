import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiX, FiZap } from 'react-icons/fi';
import styles from '../seguranca/seguranca.module.css';
import s from './MediaStudio.module.css';
import { Pill, errorMessage } from '../seguranca/ui';
import { ART_STYLES, IMAGE_SOURCE, MAX_REFS } from '../../services/marketing';
import { mediaAddon } from '../../services/billing';

const MODES = [['arte', 'Arte pronta'], ['foto', 'Fotos'], ['ia', 'Com IA']];
const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function StylePicker({ value, onChange, brand }) {
    return (
        <div className={s.styles} role="group" aria-label="Modelo da arte">
            {ART_STYLES.map(([k, label, desc]) => (
                <button key={k} type="button" className={s.style} aria-pressed={value === k} onClick={() => onChange(k)} title={desc}>
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
            <span className={styles.muted} style={{ fontSize: '.8rem' }}>Incluído no plano Enterprise. Nos outros planos, é um adicional mensal.
                As imagens e vídeos usam créditos de IA.</span>
            {addon?.pode_gerenciar && addon?.pode_contratar ? (
                <div className={styles.btn_row} style={{ alignItems: 'center' }}>
                    <span className={s.price}>{brl(addon.preco)}<small className={styles.muted}>/mês</small></span>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy} onClick={buy}>{busy ? 'Abrindo pagamento…' : 'Contratar adicional'}</button>
                </div>
            ) : <span className={styles.muted} style={{ fontSize: '.82rem' }}>Peça ao dono ou administrador do escritório para contratar.</span>}
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
        <div className={styles.stack} style={{ gap: 8, borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
            <strong style={{ fontSize: '.9rem' }}>Vídeo curto (Reels/Shorts)</strong>
            {p.video_status === 'pronto' && p.video_url && (
                <>
                    <video className={s.video} src={p.video_url} controls playsInline preload="metadata"><track kind="captions" /></video>
                    <div className={styles.btn_row}><a className={`${styles.btn} ${styles.btn_sm}`} href={p.video_url} download target="_blank" rel="noopener noreferrer">Baixar vídeo</a></div>
                </>
            )}
            {p.video_status === 'gerando' ? (
                <div className={s.spinner_row} role="status"><span className={s.dot} /> Gerando o vídeo no Gemini… a tela atualiza sozinha.</div>
            ) : (
                <>
                    {p.video_status === 'falhou' && <span style={{ color: 'var(--c-danger)', fontSize: '.84rem' }}>{p.video_erro}</span>}
                    <textarea className={styles.textarea} rows={2} maxLength={500} value={hint} onChange={(e) => setHint(e.target.value)}
                        aria-label="Cena do vídeo" placeholder="Cena do vídeo. Ex.: advogada explicando em escritório claro, câmera lenta" />
                    {photos.length > 0 && (
                        <label className={styles.field}>Começar a partir de uma foto (opcional)
                            <select className={styles.select} value={photo || ''} onChange={(e) => setPhoto(e.target.value ? Number(e.target.value) : null)}>
                                <option value="">— sem foto —</option>
                                {photos.map((ph) => <option key={ph.id} value={ph.id}>{ph.nome || `Foto ${ph.id}`}</option>)}
                            </select>
                        </label>
                    )}
                    <div><button type="button" className={styles.btn} disabled={busy || disabled} onClick={start}>
                        {busy ? 'Pedindo…' : p.video_status === 'pronto' ? 'Gerar outro vídeo' : 'Gerar vídeo com IA'}</button></div>
                </>
            )}
        </div>
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

    return (
        <div className={styles.card} style={{ background: 'var(--c-surface-2)' }}>
            <div className={styles.section_title} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                Imagem do post {p.imagem_origem && <Pill tone={p.imagem_origem === 'marca' || p.imagem_origem === 'foto' ? 'gray' : 'blue'}>{IMAGE_SOURCE[p.imagem_origem] || p.imagem_origem}</Pill>}
            </div>
            <div className={styles.segmented} role="group" aria-label="Como criar a imagem" style={{ marginBottom: 12 }}>
                {MODES.map(([k, l]) => (
                    <button key={k} type="button" aria-pressed={mode === k} className={mode === k ? styles.seg_on : ''} onClick={() => setMode(k)}>
                        {k === 'ia' && <FiZap aria-hidden="true" />} {l}
                    </button>
                ))}
            </div>

            {mode === 'arte' && (
                <div className={styles.stack} style={{ gap: 10 }}>
                    <StylePicker value={style} onChange={setStyle} brand={brandColor} />
                    {style === 'foto' && <Gallery api={api} photos={photos} setPhotos={setPhotos} selected={chosen ? [chosen] : []} onToggle={(id) => setChosen(id === chosen ? null : id)} disabled={disabled} />}
                    <div className={styles.btn_row}>
                        <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={!!busy || disabled || (needPhoto && !chosen)}
                            onClick={() => run('arte', { modo: 'marca', estilo: style, foto_id: style === 'foto' ? chosen : null })}>
                            {busy === 'arte' ? 'Montando…' : 'Usar esta arte'}</button>
                    </div>
                    <span className={styles.muted} style={{ fontSize: '.78rem' }}>Com a cor e a logo do escritório. Sem custo.</span>
                </div>
            )}

            {mode === 'foto' && (
                <div className={styles.stack} style={{ gap: 10 }}>
                    <Gallery api={api} photos={photos} setPhotos={setPhotos} selected={chosen ? [chosen] : []} onToggle={(id) => setChosen(id === chosen ? null : id)} disabled={disabled} />
                    <div className={styles.btn_row}>
                        <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={!!busy || disabled || !chosen}
                            onClick={() => run('foto', { modo: 'foto', foto_id: chosen })}>{busy === 'foto' ? 'Preparando…' : 'Usar a foto no post'}</button>
                    </div>
                    <span className={styles.muted} style={{ fontSize: '.78rem' }}>JPEG, PNG ou WebP até 8 MB.</span>
                </div>
            )}

            {mode === 'ia' && !iaOn && <Upsell addon={addon} />}
            {mode === 'ia' && iaOn && (
                <div className={styles.stack} style={{ gap: 10 }}>
                    <label className={styles.field}>O que a imagem deve mostrar
                        <textarea className={styles.textarea} rows={2} maxLength={500} value={hint} onChange={(e) => setHint(e.target.value)}
                            placeholder="Ex.: balança da justiça sobre mesa de madeira, luz natural" />
                    </label>
                    <div className={styles.field}>Fotos de referência (até {MAX_REFS}, opcional)</div>
                    <Gallery api={api} photos={photos} setPhotos={setPhotos} selected={refs} onToggle={toggleRef} multi disabled={disabled} />
                    <div className={styles.btn_row}>
                        <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={!!busy || disabled}
                            onClick={() => run('ia', { modo: 'ia', sugestao_imagem: hint, referencias: refs })}>
                            {busy === 'ia' ? 'Gerando a imagem…' : p.imagem_url ? 'Gerar outra com IA' : 'Gerar imagem com IA'}</button>
                    </div>
                    <VideoBlock api={api} p={p} onPiece={onPiece} photos={photos} disabled={disabled} />
                </div>
            )}
        </div>
    );
}
