import styles from './ui.module.css';

// Pílula clicável. Com "active" vira filtro liga/desliga (aria-pressed); sem ele é só um atalho (ex.: escolher uma ideia).
export default function Chip({ active, className = '', children, ...rest }) {
    const cls = [styles.chip, active && styles.chip_active, className].filter(Boolean).join(' ');
    return <button type="button" {...rest} className={cls} aria-pressed={active === undefined ? undefined : !!active}>{children}</button>;
}
