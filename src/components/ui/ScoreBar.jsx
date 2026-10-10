import styles from './ui.module.css';

export default function ScoreBar({ value }) {
    const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)));
    const tone = pct >= 80 ? styles.bar_fill_green : pct >= 50 ? styles.bar_fill_yellow : styles.bar_fill_red;
    return (
        <div className={styles.bar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className={`${styles.bar_fill} ${tone}`} style={{ width: `${pct}%` }} />
        </div>
    );
}
