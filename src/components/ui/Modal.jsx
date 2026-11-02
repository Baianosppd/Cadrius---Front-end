import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ui.module.css';

const SIZES = { sm: 440, md: 560, lg: 760, xl: 920 };
const FOCAVEL = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href]';

export default function Modal({ open = true, onClose, title, size = 'md', footer, busy = false, closeOnOverlay = true, closeOnEsc = true, as = 'div', children, ...rest }) {
    const Tag = as;
    const titleId = useId();
    const boxRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const anterior = document.activeElement;
        boxRef.current?.querySelector(FOCAVEL)?.focus();
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = overflow; anterior?.focus?.(); };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key !== 'Escape' || busy || !closeOnEsc) return;
            const abertos = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
            if (abertos[abertos.length - 1] === boxRef.current) onClose?.();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, busy, closeOnEsc, onClose]);

    if (!open) return null;
    return createPortal(
        <div className={styles.overlay} onMouseDown={(e) => { if (closeOnOverlay && e.target === e.currentTarget && !busy) onClose?.(); }}>
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
