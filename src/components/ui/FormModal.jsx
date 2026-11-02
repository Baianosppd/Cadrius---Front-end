import Modal from './Modal';
import Banner from './Banner';
import Button from './Button';

export default function FormModal({ onSubmit, onClose, busy, error, submitLabel = 'Salvar', busyLabel = 'Salvando…', submitVariant = 'primary', actions, children, ...modal }) {
    return (
        <Modal closeOnOverlay={false} {...modal} as="form" onSubmit={onSubmit} onClose={onClose} busy={busy}
            footer={<>
                <Button type="submit" variant={submitVariant} loading={busy} loadingLabel={busyLabel}>{submitLabel}</Button>
                <Button onClick={onClose} disabled={busy}>Cancelar</Button>
                {actions}
            </>}>
            {children}
            {error && <Banner tone="error">{error}</Banner>}
        </Modal>
    );
}
