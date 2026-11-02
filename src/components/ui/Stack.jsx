import styles from './ui.module.css';

export default function Stack({ gap = 4, align, as = 'div', className = '', children, ...rest }) {
    const Tag = as;
    const cls = [styles.l_stack, styles[`gap_${gap}`], align && styles[`align_${align}`], className].filter(Boolean).join(' ');
    return <Tag {...rest} className={cls}>{children}</Tag>;
}
