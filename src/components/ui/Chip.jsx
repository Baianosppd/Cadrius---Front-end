import styles from './ui.module.css';

// Filtro rápido em forma de pílula; "active" = selecionado (aria-pressed para leitor de tela).
export default function Chip({ active = false, className = '', children, ...rest }) {
    const cls = [styles.chip, active && styles.chip_active, className].filter(Boolean).join(' ');
    return <button type="button" {...rest} className={cls} aria-pressed={active}>{children}</button>;
}
