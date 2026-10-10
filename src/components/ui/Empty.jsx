import styles from './ui.module.css';
import { ScalesMark } from '../illustrations/LegalArt';

// Estado vazio. Com "title", vira um estado vazio ilustrado com a próxima ação (CAD-219): explica o que aparece ali
// e oferece o primeiro passo, em vez de uma tela em branco.
export default function Empty({ children = 'Nada para mostrar.', title, action }) {
    if (!title) return <div className={styles.empty}>{children}</div>;
    return (
        <div className={`${styles.empty} ${styles.empty_rich}`}>
            <ScalesMark className={styles.empty_art} />
            <div className={styles.empty_title}>{title}</div>
            {children && <div className={styles.empty_text}>{children}</div>}
            {action && <div className={styles.btn_row}>{action}</div>}
        </div>
    );
}
