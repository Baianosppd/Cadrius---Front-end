import styles from '../ui/ui.module.css';
import s from './Suporte.module.css';
import { fmtDateTime } from '../../utils/format';

// Mensagens de um chamado. staffView: na Gestão Cadrius, as mensagens da equipe ficam à direita.
export default function Conversa({ messages, staffView = false }) {
    return (
        <div className={s.conversa}>
            {messages.map((m) => (
                <div key={m.id} className={[styles.card, s.msg, m.from_staff === staffView && s.msg_mine,
                    m.internal ? s.msg_internal : m.from_staff && s.msg_staff].filter(Boolean).join(' ')}>
                    <div className={`${styles.muted} ${styles.text_xs}`}>{m.internal ? 'Nota interna · ' : ''}{m.author || (m.from_staff ? 'Equipe Cadrius' : 'Você')} · {fmtDateTime(m.created_at)}</div>
                    <div className={styles.pre_wrap}>{m.body}</div>
                </div>
            ))}
        </div>
    );
}
