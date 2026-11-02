import styles from './ui.module.css';
import Loading from './Loading';

export default function Table({ columns, loading = false, empty, stack = true, flat = false, className = '', children }) {
    const cols = columns.map((c) => (typeof c === 'string' ? { label: c } : c));
    if (loading) return <Loading />;
    return (
        <div className={flat ? `${styles.table_wrap} ${styles.table_flat}` : styles.table_wrap}>
            <table className={[styles.table, stack && styles.table_stack, className].filter(Boolean).join(' ')}>
                <thead><tr>{cols.map((c, i) => <th key={i} className={c.className}>{c.label}</th>)}</tr></thead>
                <tbody>
                    {empty ? <tr><td colSpan={cols.length}>{empty}</td></tr> : children}
                </tbody>
            </table>
        </div>
    );
}
