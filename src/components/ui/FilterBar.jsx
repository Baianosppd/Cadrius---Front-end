import styles from './ui.module.css';

export default function FilterBar({ as = 'div', className = '', children, ...rest }) {
    const Tag = as;
    return <Tag {...rest} className={[styles.filters, className].filter(Boolean).join(' ')}>{children}</Tag>;
}
