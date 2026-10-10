import styles from './ui.module.css';

// <select> com o visual do kit. As <option> vão como children.
export default function Select({ size = 'md', invalid = false, className = '', children, ...rest }) {
    const cls = [styles.select, size === 'lg' && styles.input_lg, className].filter(Boolean).join(' ');
    return <select {...rest} className={cls} aria-invalid={invalid || undefined}>{children}</select>;
}
