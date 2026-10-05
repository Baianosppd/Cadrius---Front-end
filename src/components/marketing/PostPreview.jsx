import { FiBookmark, FiHeart, FiMessageCircle, FiMoreHorizontal, FiSend, FiShare2, FiThumbsUp } from 'react-icons/fi';
import { ScalesMark } from '../illustrations/LegalArt';
import { parseHashtags } from '../../services/marketing';
import styles from './PostPreview.module.css';

// Pré-visualização do conteúdo como ele aparece em cada canal (CAD-219): ajuda a revisar o texto no contexto real
// (corte do "ver mais", imagem, hashtags) antes de aprovar. É uma simulação visual, não a interface oficial das redes.
const initials = (name) => (name || 'C').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

function Media({ image, hint, ratio = '1 / 1' }) {
    if (image) return <img className={styles.media} src={image} alt="" style={{ aspectRatio: ratio }} />;
    return (
        <div className={styles.media_ph} style={{ aspectRatio: ratio }}>
            <ScalesMark className={styles.media_art} />
            <span>{hint ? `Arte sugerida: ${hint}` : 'Sem imagem'}</span>
        </div>
    );
}

function Text({ text, limit, tags }) {
    const cut = limit && text.length > limit;
    return (
        <p className={styles.text}>
            {cut ? `${text.slice(0, limit).trimEnd()}… ` : `${text} `}
            {cut && <span className={styles.more}>mais</span>}
            {!cut && tags.length > 0 && <span className={styles.tags}>{tags.map((t) => `#${t}`).join(' ')}</span>}
        </p>
    );
}

export default function PostPreview({ channel, brand = 'Seu escritório', title = '', text = '', hashtags = '', image = '', hint = '' }) {
    const tags = parseHashtags(hashtags);
    const head = (sub) => (
        <div className={styles.head}>
            <span className={styles.avatar}>{initials(brand)}</span>
            <span className={styles.who}><strong>{brand}</strong><small>{sub}</small></span>
            <FiMoreHorizontal className={styles.dots} aria-hidden="true" />
        </div>
    );
    if (channel === 'instagram') {
        return (
            <div className={styles.phone} aria-label="Pré-visualização no Instagram">
                {head('Conteúdo informativo')}
                <Media image={image} hint={hint} />
                <div className={styles.bar}><FiHeart /><FiMessageCircle /><FiSend /><FiBookmark className={styles.right} /></div>
                <div className={styles.body}><strong>{brand.toLowerCase().replace(/\s+/g, '')}</strong> <Text text={text} limit={125} tags={tags} /></div>
            </div>
        );
    }
    if (channel === 'linkedin' || channel === 'facebook') {
        const li = channel === 'linkedin';
        return (
            <div className={styles.feed} aria-label={`Pré-visualização no ${li ? 'LinkedIn' : 'Facebook'}`}>
                {head(li ? 'Escritório de advocacia · agora' : 'agora · público')}
                <div className={styles.body}><Text text={text} limit={li ? 210 : 280} tags={tags} /></div>
                {(image || hint) && <Media image={image} hint={hint} ratio="1.91 / 1" />}
                <div className={`${styles.bar} ${styles.bar_feed}`}>
                    <span><FiThumbsUp /> {li ? 'Gostei' : 'Curtir'}</span><span><FiMessageCircle /> Comentar</span><span><FiShare2 /> {li ? 'Compartilhar' : 'Compartilhar'}</span>
                </div>
            </div>
        );
    }
    if (channel === 'google_business') {
        return (
            <div className={styles.feed} aria-label="Pré-visualização no Perfil da empresa no Google">
                {head('Novidade · Perfil no Google')}
                {(image || hint) && <Media image={image} hint={hint} ratio="4 / 3" />}
                <div className={styles.body}><Text text={text} limit={300} tags={[]} /></div>
                <div className={styles.cta}>Saiba mais</div>
            </div>
        );
    }
    if (channel === 'video_curto') {
        return (
            <div className={styles.reel} aria-label="Pré-visualização de vídeo curto">
                <ScalesMark className={styles.reel_art} />
                <div className={styles.reel_text}><strong>{title || 'Roteiro'}</strong><span>{text.slice(0, 160)}{text.length > 160 ? '…' : ''}</span></div>
            </div>
        );
    }
    return (
        <article className={styles.article} aria-label="Pré-visualização do artigo">
            <span className={styles.kicker}>{channel === 'newsletter' ? 'Newsletter' : 'Blog do escritório'}</span>
            <h4>{title || 'Título do conteúdo'}</h4>
            <p>{text.slice(0, 320)}{text.length > 320 ? '…' : ''}</p>
            <span className={styles.byline}>{brand}</span>
        </article>
    );
}
