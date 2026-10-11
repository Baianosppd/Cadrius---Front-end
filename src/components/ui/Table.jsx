import styles from './ui.module.css';
import Loading from './Loading';

// Tabela padrão: casca com rolagem, cabeçalho a partir de "columns", linha de vazio e carregando.
// columns = ['Nome', …] ou [{ label, className }]. stack (padrão) vira cartões no celular — use data-label nos <td>.
export default function Table({ columns, loading = false, empty, stack = true, className = '', children }) {
    const cols = columns.map((c) => (typeof c === 'string' ? { label: c } : c));
    if (loading) return <Loading />;
    return (
        <div className={styles.table_wrap}>
            <table className={[styles.table, stack && styles.table_stack, className].filter(Boolean).join(' ')}>
                <thead><tr>{cols.map((c, i) => <th key={i} className={c.className}>{c.label}</th>)}</tr></thead>
                <tbody>
                    {empty ? <tr><td colSpan={cols.length}>{empty}</td></tr> : children}
                </tbody>
            </table>
        </div>
    );
}
