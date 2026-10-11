import styles from './ui.module.css';

// Barra de filtros: campos lado a lado que quebram no celular. as="form" para o Enter buscar.
export default function FilterBar({ as = 'div', className = '', children, ...rest }) {
    const Tag = as;
    return <Tag {...rest} className={[styles.filters, className].filter(Boolean).join(' ')}>{children}</Tag>;
}
