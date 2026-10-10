import Modal from './Modal';
import Banner from './Banner';
import styles from './ui.module.css';

// Modal de formulário: Enter envia, mostra o erro da API e trava os botões enquanto salva.
// "error" aceita texto ou JSX (ex.: mensagem + link). Usar junto com hooks/useSubmit.
export default function FormModal({ onSubmit, onClose, busy, error, submitLabel = 'Salvar', busyLabel = 'Salvando…', children, ...modal }) {
    return (
        <Modal {...modal} as="form" onSubmit={onSubmit} onClose={onClose} busy={busy}
            footer={<>
                <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>{busy ? busyLabel : submitLabel}</button>
                <button type="button" className={styles.btn} onClick={onClose} disabled={busy}>Cancelar</button>
            </>}>
            {children}
            {error && <Banner tone="error">{error}</Banner>}
        </Modal>
    );
}
