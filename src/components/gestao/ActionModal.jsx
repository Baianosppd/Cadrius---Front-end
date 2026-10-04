import { useState } from 'react';
import styles from '../seguranca/seguranca.module.css';
import { Banner, errorMessage } from '../seguranca/ui';
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
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <form className={styles.modal} onSubmit={submit}>
                <div className={styles.modal_title}>{title}</div>
                <div className={styles.muted}>{subject}</div>
                {spec.danger && <Banner tone="warn">Ação sensível: afeta o acesso do cliente imediatamente.</Banner>}
                {(spec.fields || []).map((f) => (
                    <label key={f.name} className={styles.field}>{f.label}
                        <input className={styles.input} type="number" min={f.min} max={f.max} value={values[f.name]}
                            onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
                    </label>
                ))}
                <label className={styles.field}>Motivo (mínimo {MIN_REASON} caracteres — fica registrado na auditoria)
                    <textarea className={styles.textarea} value={values.reason || ''} maxLength={255}
                        onChange={(e) => setValues((v) => ({ ...v, reason: e.target.value }))} />
                </label>
                {error && <Banner tone="error">{error}</Banner>}
                <div className={styles.btn_row}>
                    <button type="submit" className={`${styles.btn} ${spec.danger ? styles.btn_danger : styles.btn_primary}`} disabled={busy}>
                        {busy ? 'Executando…' : 'Confirmar'}
                    </button>
                    <button type="button" className={styles.btn} onClick={onClose} disabled={busy}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}
