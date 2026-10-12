import styles from '../ui/ui.module.css';
import { CHANNEL_COLOR, CHANNEL_LABEL } from '../../services/marketing';

// Selo do canal com a cor da rede (identificação rápida). A cor vem do canal, por isso a variável inline.
export default function ChannelTag({ canal }) {
    return <span className={styles.channel_tag} style={{ '--ch': CHANNEL_COLOR[canal] || 'var(--c-muted)' }}>{CHANNEL_LABEL[canal] || canal}</span>;
}
