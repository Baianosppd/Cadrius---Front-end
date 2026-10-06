import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiEdit3 } from 'react-icons/fi';
import styles from '../seguranca/seguranca.module.css';
import { errorMessage } from '../seguranca/ui';
import { WRITE_ACTIONS, assistantApi } from '../../services/assistant';

// "Escrever com IA" para qualquer campo de texto (CAD-221): propõe o novo texto; a pessoa escolhe substituir ou descartar.
export default function AIWriteMenu({ value, onApply, actions = ['corrigir', 'formal', 'simples', 'resumir'] }) {
    const [busy, setBusy] = useState(false);
    const [preview, setPreview] = useState(null);
    const run = async (key) => {
        if (!key || !value?.trim()) return;
        setBusy(true);
        try {
            setPreview((await assistantApi.write(key, value)).texto);
        } catch (e) {
            toast.error(errorMessage(e));
        } finally {
            setBusy(false);
        }
    };
    return (
        <>
            <label className={styles.btn_row} style={{ alignItems: 'center' }}>
                <FiEdit3 aria-hidden="true" />
                <select className={styles.select} style={{ width: 'auto' }} value="" disabled={busy || !value?.trim()} aria-label="Escrever com IA"
                    onChange={(e) => run(e.target.value)}>
                    <option value="">{busy ? 'A IA está escrevendo…' : 'Escrever com IA…'}</option>
                    {WRITE_ACTIONS.filter((w) => actions.includes(w.key)).map((w) => <option key={w.key} value={w.key}>{w.label}</option>)}
                </select>
            </label>
            {preview !== null && (
                <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="aiw-title">
                    <div className={styles.modal} style={{ maxWidth: 760, width: '100%' }}>
                        <div className={styles.modal_title} id="aiw-title">Sugestão da IA — confira antes de usar</div>
                        <div style={{ whiteSpace: 'pre-wrap', maxHeight: '55vh', overflow: 'auto', fontSize: 'var(--fs-md)', lineHeight: 1.55 }}>{preview}</div>
                        <div className={styles.btn_row}>
                            <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => { onApply(preview); setPreview(null); }}>Substituir o texto</button>
                            <button type="button" className={styles.btn} onClick={() => setPreview(null)}>Descartar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
