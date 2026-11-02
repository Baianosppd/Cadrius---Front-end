import styles from './ui.module.css';

export default function Textarea({ invalid = false, className = '', ...rest }) {
    const cls = [styles.textarea, className].filter(Boolean).join(' ');
    return <textarea {...rest} className={cls} aria-invalid={invalid || undefined} />;
}
