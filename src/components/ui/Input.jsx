import styles from './ui.module.css';

export default function Input({ size = 'md', invalid = false, className = '', ...rest }) {
    const cls = [styles.input, size === 'lg' && styles.input_lg, className].filter(Boolean).join(' ');
    return <input {...rest} className={cls} aria-invalid={invalid || undefined} />;
}
