import { useState } from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';
import styles from '../seguranca/seguranca.module.css';
import { Banner } from '../seguranca/ui';

// Senha temporária (CAD-221): aparece UMA vez. A TI repassa por canal seguro; a pessoa troca no próximo acesso.
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
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="temp-title">
            <div className={styles.modal}>
                <div className={styles.modal_title} id="temp-title">Senha temporária criada</div>
                <div className={styles.muted}>{email}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <code aria-label="Senha temporária" style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'var(--c-surface-3)',
                        fontSize: 18, letterSpacing: '.06em', userSelect: 'all', color: 'var(--c-ink)' }}>{password}</code>
                    <button type="button" className={styles.btn} onClick={copy}>
                        {copied ? <><FiCheck aria-hidden="true" /> Copiada</> : <><FiCopy aria-hidden="true" /> Copiar</>}
                    </button>
                </div>
                <Banner tone="warn">
                    Esta senha não será mostrada de novo. Passe à pessoa por um canal seguro (pessoalmente ou por telefone) — nunca
                    no mesmo e-mail ou mensagem que o login. No próximo acesso ela será obrigada a criar uma senha nova; as sessões abertas
                    foram encerradas.
                </Banner>
                <div className={styles.btn_row}>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={onClose}>Entendi</button>
                </div>
            </div>
        </div>
    );
}
