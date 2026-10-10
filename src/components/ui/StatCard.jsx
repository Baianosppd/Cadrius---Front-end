import styles from './ui.module.css';

export default function StatCard({ title, value, note, tone }) {
    const color = { red: 'var(--c-danger)', green: 'var(--c-success)', yellow: 'var(--c-warning)' }[tone];
    return (
        <div className={`${styles.card} ${styles.stat_card}`}>
            <div className={styles.card_title}>{title}</div>
            <div className={styles.card_value} style={color ? { color } : undefined} title={typeof value === 'string' ? value : undefined}>{value}</div>
            {note && <div className={styles.card_note}>{note}</div>}
        </div>
    );
}
