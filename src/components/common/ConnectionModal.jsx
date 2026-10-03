import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { CONNECTION_APPS } from '../../services/connections';
import styles from '../seguranca/seguranca.module.css';
import { Banner, errorMessage } from '../seguranca/ui';

// Cria uma conexão (POST /api/v1/connections/). O segredo é enviado uma única vez e nunca mais exibido.
export default function ConnectionModal({ appKey, onClose, onSaved }) {
    const app = CONNECTION_APPS[appKey];
    const [name, setName] = useState(app.label);
    const [values, setValues] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        const missing = app.fields.find((f) => f.required && !(values[f.key] || '').trim());
        if (missing) { setError(`Preencha: ${missing.label}.`); return; }
        setSaving(true); setError(null);
        try {
            await api.post('connections/', { name: name.trim(), app_name: appKey, credentials: values });
            toast.success('Conexão salva.');
            onSaved();
            onClose();
        } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
    };

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="conn-title" onClick={onClose}>
            <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit} autoComplete="off">
                <h2 id="conn-title" className={styles.modal_title}>Conectar {app.label}</h2>
                <label className={styles.field}>Nome da conexão
                    <input className={styles.input} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} required />
                </label>
                {app.fields.map((f) => (
                    <label key={f.key} className={styles.field}>{f.label}
                        <input
                            className={styles.input} type={f.secret ? 'password' : 'text'} autoComplete="off"
                            placeholder={f.placeholder} value={values[f.key] || ''}
                            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                        />
                    </label>
                ))}
                <Banner tone="info">As credenciais são guardadas cifradas e não podem ser visualizadas depois de salvas.</Banner>
                {error && <Banner tone="error">{error}</Banner>}
                <div className={styles.btn_row} style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className={styles.btn} onClick={onClose}>Cancelar</button>
                    <button className={`${styles.btn} ${styles.btn_primary}`} disabled={saving}>{saving ? 'Salvando…' : 'Salvar conexão'}</button>
                </div>
            </form>
        </div>
    );
}
