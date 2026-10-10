import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ui.module.css';

const SIZES = { sm: 440, md: 560, lg: 760 };
const FOCAVEL = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href]';

// Janela modal base: fecha no Esc e no clique fora, foca o 1º campo e devolve o foco ao fechar.
// "busy" impede fechar enquanto algo está sendo salvo; "as" troca a tag da caixa (FormModal usa "form").
export default function Modal({ open = true, onClose, title, size = 'md', footer, busy = false, as: Tag = 'div', children, ...rest }) {
    const titleId = useId();
    const boxRef = useRef(null);

    // Ao abrir: foca o 1º campo e trava a rolagem da página. Ao fechar: desfaz os dois.
    useEffect(() => {
        if (!open) return;
        const anterior = document.activeElement;
        boxRef.current?.querySelector(FOCAVEL)?.focus();
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = overflow; anterior?.focus?.(); };
    }, [open]);

    // Esc fecha (menos enquanto está salvando)
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose?.(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, busy, onClose]);

    if (!open) return null;
    // Clique fora só fecha se começou no fundo — selecionar texto e soltar fora não fecha
    return createPortal(
        <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose?.(); }}>
            <Tag ref={boxRef} className={styles.modal} style={{ maxWidth: SIZES[size] ?? size }}
                role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} {...rest}>
                {title && <h2 id={titleId} className={styles.modal_title}>{title}</h2>}
                {children}
                {footer && <div className={styles.btn_row}>{footer}</div>}
            </Tag>
        </div>,
        document.body,
    );
}
