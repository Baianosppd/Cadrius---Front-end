import Modal from './Modal';
import Banner from './Banner';
import Button from './Button';

// Modal de formulário: Enter envia, clique fora não fecha (só Esc/Cancelar), mostra o erro da API e trava os botões enquanto salva.
// "error" aceita texto ou JSX (ex.: mensagem + link). "actions" = botões extras depois do Cancelar.
// Usar junto com hooks/useSubmit.
export default function FormModal({ onSubmit, onClose, busy, error, submitLabel = 'Salvar', busyLabel = 'Salvando…', actions, children, ...modal }) {
    return (
        <Modal closeOnOverlay={false} {...modal} as="form" onSubmit={onSubmit} onClose={onClose} busy={busy}
            footer={<>
                <Button type="submit" variant="primary" loading={busy} loadingLabel={busyLabel}>{submitLabel}</Button>
                <Button onClick={onClose} disabled={busy}>Cancelar</Button>
                {actions}
            </>}>
            {children}
            {error && <Banner tone="error">{error}</Banner>}
        </Modal>
    );
}
