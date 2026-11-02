import styles from './ui.module.css';

export default function Row({ gap = 2, align = 'center', justify, wrap = true, as = 'div', className = '', children, ...rest }) {
    const Tag = as;
    const cls = [styles.l_row, styles[`gap_${gap}`], styles[`align_${align}`], justify && styles[`justify_${justify}`],
        !wrap && styles.nowrap, className].filter(Boolean).join(' ');
    return <Tag {...rest} className={cls}>{children}</Tag>;
}
