import styles from './ui.module.css';

// Aviso colorido (info | warn | error | ok). Erro já anuncia para leitor de tela; outras props (ex.: role="status") vão para a caixa.
export default function Banner({ tone = 'info', className = '', children, ...rest }) {
    const cls = { warn: styles.banner_warn, error: styles.banner_error, ok: styles.banner_ok, info: styles.banner_info }[tone];
    return <div role={tone === 'error' ? 'alert' : undefined} {...rest} className={[styles.banner, cls, className].filter(Boolean).join(' ')}>{children}</div>;
}
