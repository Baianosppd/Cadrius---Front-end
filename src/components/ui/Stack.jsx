import styles from './ui.module.css';

// Coluna: um item embaixo do outro. gap na escala dos tokens (1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px).
// "as" troca a tag (ex.: as="form", as="ul").
export default function Stack({ gap = 4, align, as = 'div', className = '', children, ...rest }) {
    const Tag = as;
    const cls = [styles.l_stack, styles[`gap_${gap}`], align && styles[`align_${align}`], className].filter(Boolean).join(' ');
    return <Tag {...rest} className={cls}>{children}</Tag>;
}
