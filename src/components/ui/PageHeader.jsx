import styles from './ui.module.css';

// Cabeçalho padrão das telas (CAD-219): título, subtítulo curto e ações à direita
export default function PageHeader({ title, subtitle, actions }) {
    return (
        <div className={styles.header_row}>
            <div>
                <h1 className={styles.page_title}>{title}</h1>
                {subtitle && <p className={styles.page_subtitle}>{subtitle}</p>}
            </div>
            {actions && <div className={styles.btn_row}>{actions}</div>}
        </div>
    );
}
