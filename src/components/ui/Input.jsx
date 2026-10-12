import styles from './ui.module.css';

// <input> com o visual do kit. size="lg" nas telas de login; invalid = borda vermelha.
export default function Input({ size = 'md', invalid = false, className = '', ...rest }) {
    const cls = [styles.input, size === 'lg' && styles.input_lg, className].filter(Boolean).join(' ');
    return <input {...rest} className={cls} aria-invalid={invalid || undefined} />;
}
