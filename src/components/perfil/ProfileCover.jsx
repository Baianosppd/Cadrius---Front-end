import { useEffect, useRef, useState } from 'react';
import { FiCamera, FiImage, FiTrash2, FiCheck } from 'react-icons/fi';
import styles from './ProfileCover.module.css';

// CAD-230: capa do perfil — imagem própria ou um fundo pronto, foto por cima e uma frase curta sobre o escritório
const COVER_PRESETS = [
    ['', 'Padrão'], ['azul', 'Azul'], ['verde', 'Verde'], ['vinho', 'Vinho'],
    ['grafite', 'Grafite'], ['dourado', 'Dourado'], ['aurora', 'Aurora'],
];

const ProfileCover = ({ user, onUpload, onRemove, onSaveCover }) => {
    const photoRef = useRef(null);
    const coverRef = useRef(null);
    const [editing, setEditing] = useState(false);
    const [caption, setCaption] = useState(user.cover_caption || '');
    const [busy, setBusy] = useState('');
    useEffect(() => { setCaption(user.cover_caption || ''); }, [user.cover_caption]);

    const pick = async (kind, e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setBusy(kind);
        try { await onUpload(kind, file); } finally { setBusy(''); }
    };
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
    const preset = user.cover_preset || '';

    return (
        <section className={styles.cover_card} aria-label="Capa do perfil">
            <div className={`${styles.cover} ${styles[`p_${preset || 'padrao'}`]}`}
                style={user.cover_image ? { backgroundImage: `url("${user.cover_image}")` } : undefined}>
                <div className={styles.cover_actions}>
                    <button type="button" className={styles.ghost} onClick={() => coverRef.current?.click()} disabled={busy === 'capa'}>
                        <FiImage aria-hidden="true" /> {busy === 'capa' ? 'Enviando…' : 'Trocar capa'}
                    </button>
                    <button type="button" className={styles.ghost} onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
                        Personalizar
                    </button>
                </div>
                <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick('capa', e)} />
            </div>
            <div className={styles.identity}>
                <div className={styles.avatar_wrap}>
                    <div className={styles.avatar}>
                        {user.profile_picture
                            ? <img src={user.profile_picture} alt="" />
                            : <span>{user.initials || '?'}</span>}
                    </div>
                    <button type="button" className={styles.camera} onClick={() => photoRef.current?.click()}
                        aria-label="Trocar foto" disabled={busy === 'foto'}>
                        <FiCamera aria-hidden="true" />
                    </button>
                    <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick('foto', e)} />
                </div>
                <div className={styles.who}>
                    <strong>{name}</strong>
                    {user.cover_caption ? <span>{user.cover_caption}</span> : <span className={styles.muted}>{user.email}</span>}
                </div>
            </div>
            {editing && (
                <div className={styles.editor}>
                    <div className={styles.label}>Fundo da capa (quando não há imagem)</div>
                    <div className={styles.swatches} role="radiogroup" aria-label="Fundo da capa">
                        {COVER_PRESETS.map(([key, label]) => (
                            <button key={key || 'padrao'} type="button" role="radio" aria-checked={preset === key} title={label}
                                className={`${styles.swatch} ${styles[`p_${key || 'padrao'}`]}`} onClick={() => onSaveCover({ cover_preset: key })}>
                                {preset === key && <FiCheck aria-hidden="true" />}
                                <span className={styles.sr}>{label}</span>
                            </button>
                        ))}
                    </div>
                    <label className={styles.label} htmlFor="cover-caption">Frase na capa (até 140 caracteres)</label>
                    <div className={styles.row}>
                        <input id="cover-caption" className={styles.input} maxLength={140} value={caption}
                            placeholder="Ex.: Advocacia de família há 15 anos · Corinthiano · Café e processos"
                            onChange={(e) => setCaption(e.target.value)} />
                        <button type="button" className={styles.primary} onClick={() => onSaveCover({ cover_caption: caption.trim() })}>Salvar</button>
                    </div>
                    <div className={styles.row}>
                        {user.cover_image && (
                            <button type="button" className={styles.link_danger} onClick={() => onRemove('capa')}>
                                <FiTrash2 aria-hidden="true" /> Remover imagem da capa
                            </button>
                        )}
                        {user.profile_picture && (
                            <button type="button" className={styles.link_danger} onClick={() => onRemove('foto')}>
                                <FiTrash2 aria-hidden="true" /> Remover foto
                            </button>
                        )}
                    </div>
                    <p className={styles.muted}>JPEG, PNG ou WebP até 5 MB. A localização e os dados da câmera são removidos da imagem.</p>
                </div>
            )}
        </section>
    );
};

export default ProfileCover;
