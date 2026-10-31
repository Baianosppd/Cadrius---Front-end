import { useState } from 'react';
import styles from '../ui/ui.module.css';
import { Banner, Field, FormModal, Input, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
import { MIN_REASON, buildActionBody } from '../../services/backoffice';

// Confirmação de ação administrativa: motivo obrigatório (vai para a auditoria) + campos numéricos da ação
export default function ActionModal({ title, subject, actionKey, spec, onRun, onClose }) {
    const [values, setValues] = useState(() => Object.fromEntries((spec.fields || []).map((f) => [f.name, f.initial ?? ''])));
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        const built = buildActionBody(actionKey, values, spec);
        if (!built.ok) { setError(built.error); return; }
        setBusy(true);
        setError('');
        try {
            await onRun(built.body);
            onClose();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <FormModal title={title} onClose={onClose} onSubmit={submit} busy={busy} error={error}
            submitLabel="Confirmar" busyLabel="Executando…" submitVariant={spec.danger ? 'danger' : 'primary'}>
            <div className={`${styles.muted} ${styles.mt_0}`}>{subject}</div>
            {spec.danger && <Banner tone="warn">Ação sensível: afeta o acesso do cliente imediatamente.</Banner>}
            {(spec.fields || []).map((f) => (
                <Field key={f.name} label={f.label}>
                    <Input type="number" min={f.min} max={f.max} value={values[f.name]}
                        onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
                </Field>
            ))}
            <Field label="Motivo" hint={`Mínimo de ${MIN_REASON} caracteres. Fica registrado na auditoria.`}>
                <Textarea value={values.reason || ''} maxLength={255} onChange={(e) => setValues((v) => ({ ...v, reason: e.target.value }))} />
            </Field>
        </FormModal>
    );
}
