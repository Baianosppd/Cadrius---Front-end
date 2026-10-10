import styles from './ui.module.css';

const VARIANT = { default: '', primary: styles.btn_primary, ghost: styles.btn_ghost, danger: styles.btn_danger };
const SIZE = { sm: styles.btn_sm, md: '', lg: styles.btn_lg };

// Botão padrão. Sem "type", NÃO envia formulário (só type="submit" envia).
// "as" vira link (as={Link} to="/x" ou as="a" href="…"); "loading" trava e mostra o spinner.
export default function Button({ variant = 'default', size = 'md', icon: Icon, loading = false, loadingLabel,
    block = false, as: Tag = 'button', type, disabled, className = '', children, ...rest }) {
    const isButton = Tag === 'button';
    const cls = [styles.btn, VARIANT[variant], SIZE[size], block && styles.btn_block, className].filter(Boolean).join(' ');
    return (
        <Tag {...rest} className={cls}
            type={isButton ? type ?? 'button' : type}
            disabled={isButton ? disabled || loading : undefined}
            aria-busy={loading || undefined}>
            {loading ? <span className={styles.spinner} aria-hidden="true" /> : Icon && <Icon aria-hidden="true" />}
            {loading && loadingLabel ? loadingLabel : children}
        </Tag>
    );
}
