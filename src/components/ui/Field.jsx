import styles from './ui.module.css';

// Rótulo de um campo. O <label> envolve o campo, então clicar no texto foca o input (sem precisar de id).
// "hint" = dica embaixo; "error" = erro daquele campo (substitui a dica).
export default function Field({ label, hint, error, className = '', children }) {
    return (
        <label className={[styles.field, className].filter(Boolean).join(' ')}>
            {label}
            {children}
            {error ? <span className={styles.field_error} role="alert">{error}</span>
                : hint && <span className={styles.field_hint}>{hint}</span>}
        </label>
    );
}
