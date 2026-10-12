import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiEdit3 } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import { Button, Modal, Row, Select } from '../ui';
import { errorMessage } from '../../utils/format';
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
            <Row as="label" gap={2}>
                <FiEdit3 aria-hidden="true" />
                <Select className={styles.w_fit} value="" disabled={busy || !value?.trim()} aria-label="Escrever com IA"
                    onChange={(e) => run(e.target.value)}>
                    <option value="">{busy ? 'A IA está escrevendo…' : 'Escrever com IA…'}</option>
                    {WRITE_ACTIONS.filter((w) => actions.includes(w.key)).map((w) => <option key={w.key} value={w.key}>{w.label}</option>)}
                </Select>
            </Row>
            {preview !== null && (
                <Modal title="Sugestão da IA — confira antes de usar" size="lg" onClose={() => setPreview(null)}
                    footer={<>
                        <Button variant="primary" onClick={() => { onApply(preview); setPreview(null); }}>Substituir o texto</Button>
                        <Button onClick={() => setPreview(null)}>Descartar</Button>
                    </>}>
                    <div className={styles.ai_preview}>{preview}</div>
                </Modal>
            )}
        </>
    );
}
