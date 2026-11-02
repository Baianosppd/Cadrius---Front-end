import styles from './ui.module.css';

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
