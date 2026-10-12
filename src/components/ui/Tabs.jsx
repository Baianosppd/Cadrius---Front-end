import styles from './ui.module.css';

// Abas. tabs = [{ id, label, count? }]; setas ← → trocam de aba (padrão de acessibilidade de tablist).
export default function Tabs({ tabs, value, onChange, className = '', ...rest }) {
    const move = (e, i) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        const next = tabs[(i + step + tabs.length) % tabs.length];
        onChange(next.id);
        e.currentTarget.parentElement.querySelector(`[data-tab="${next.id}"]`)?.focus();
    };
    return (
        <div {...rest} className={[styles.tabs, className].filter(Boolean).join(' ')} role="tablist">
            {tabs.map((t, i) => {
                const active = t.id === value;
                return (
                    <button key={t.id} type="button" role="tab" data-tab={t.id} aria-selected={active} tabIndex={active ? 0 : -1}
                        className={`${styles.tab} ${active ? styles.tab_active : ''}`} onClick={() => onChange(t.id)} onKeyDown={(e) => move(e, i)}>
                        {t.label}
                        {t.count !== undefined && t.count !== null && <span className={styles.count}>{t.count}</span>}
                    </button>
                );
            })}
        </div>
    );
}
