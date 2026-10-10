import styles from './ui.module.css';

// <textarea> com o visual do kit (altura mínima e redimensiona só na vertical).
export default function Textarea({ invalid = false, className = '', ...rest }) {
    const cls = [styles.textarea, className].filter(Boolean).join(' ');
    return <textarea {...rest} className={cls} aria-invalid={invalid || undefined} />;
}
