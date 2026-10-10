import styles from './ui.module.css';

export default function Banner({ tone = 'info', children }) {
    const cls = { warn: styles.banner_warn, error: styles.banner_error, ok: styles.banner_ok, info: styles.banner_info }[tone];
    return <div className={`${styles.banner} ${cls}`} role={tone === 'error' ? 'alert' : undefined}>{children}</div>;
}
