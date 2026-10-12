import styles from './ui.module.css';

// CAD-233: carregamento com barras (em vez de "Carregando…" solto); quem usa leitor de tela ouve "Carregando".
export default function Loading({ lines = 3 }) {
    return (
        <div className={styles.loading} role="status" aria-live="polite">
            <span className={styles.sr_only}>Carregando…</span>
            {Array.from({ length: lines }, (_, i) => <span key={i} className={styles.skeleton} style={{ width: `${[92, 74, 58, 84][i % 4]}%` }} />)}
        </div>
    );
}
