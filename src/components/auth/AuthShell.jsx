import { CourthouseScene } from '../illustrations/LegalArt';
import styles from './AuthShell.module.css';
import BrandLogo from '../brand/BrandLogo';

// Moldura das telas de acesso (CAD-225): mesma identidade do login, formulário compacto no padrão de sistemas de gestão.
export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
    return (
        <div className={styles.wrapper}>
            <aside className={styles.side} aria-hidden="true">
                <p className={styles.brand}><BrandLogo size={44} tone="light" /></p>
                <p className={styles.tagline}>Gestão jurídica com IA. Seus dados cifrados e cada acesso registrado.</p>
                <div className={styles.art} data-theme="dark"><CourthouseScene style={{ width: '100%', height: 'auto' }} /></div>
            </aside>
            <main className={styles.main}>
                <div className={styles.card}>
                    <div className={styles.mobile_brand} aria-hidden="true"><BrandLogo size={32} /></div>
                    <div>
                        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
                        <h1 className={styles.title}>{title}</h1>
                    </div>
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    {children}
                    {footer && <div className={styles.footer}>{footer}</div>}
                </div>
            </main>
        </div>
    );
}

export { styles as authStyles };
