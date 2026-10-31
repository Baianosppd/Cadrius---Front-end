import { useState } from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import { Banner, Button, Modal, Row } from '../ui';
import g from './Gestao.module.css';

// Senha temporária (CAD-221): aparece UMA vez — só o "Entendi" fecha (nem Esc nem clique fora).
// A TI repassa por canal seguro; a pessoa troca no próximo acesso.
export default function TempPasswordModal({ email, password, onClose }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };
    return (
        <Modal title="Senha temporária criada" onClose={onClose} closeOnOverlay={false} closeOnEsc={false}
            footer={<Button variant="primary" className={styles.ml_auto} onClick={onClose}>Entendi</Button>}>
            <div className={styles.muted}>{email}</div>
            <Row wrap={false}>
                <code aria-label="Senha temporária" className={g.secret}>{password}</code>
                <Button icon={copied ? FiCheck : FiCopy} onClick={copy}>{copied ? 'Copiada' : 'Copiar'}</Button>
            </Row>
            <Banner tone="warn">
                Esta senha não será mostrada de novo. Passe à pessoa por um canal seguro (pessoalmente ou por telefone) — nunca
                no mesmo e-mail ou mensagem que o login. No próximo acesso ela será obrigada a criar uma senha nova; as sessões abertas
                foram encerradas.
            </Banner>
        </Modal>
    );
}
