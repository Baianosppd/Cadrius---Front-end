import { useCallback, useEffect, useState } from 'react';
import api, { CONSENT_REQUIRED_EVENT } from '../../services/api';
import styles from './seguranca.module.css';
import { Banner, errorMessage } from './ui';
import Markdown from './Markdown';

const KIND_LABEL = { terms: 'Termos de Uso', privacy: 'Política de Privacidade', ciencia: 'Termo de Ciência do Uso de Dados' };

// Modal de reaceite (LGPD): abre quando há documentos novos pendentes (ao entrar) ou quando o back responde 428.
// O texto exibido é o da versão vigente; o aceite grava versão + hash no servidor (prova).
export default function ConsentModal() {
    const [pending, setPending] = useState([]);
    const [accepted, setAccepted] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get('legal/consents/me/');
            setPending(data.pending || []);
        } catch {
            /* sem rede/sessão: o interceptor trata */
        }
    }, []);

    useEffect(() => {
        load();
        window.addEventListener(CONSENT_REQUIRED_EVENT, load);
        return () => window.removeEventListener(CONSENT_REQUIRED_EVENT, load);
    }, [load]);

    if (pending.length === 0) return null;

    const allChecked = pending.every((d) => accepted[d.id]);

    const submit = async () => {
        setSaving(true);
        setError(null);
        try {
            for (const doc of pending) {
                await api.post('legal/consents/', { document_id: doc.id, granted: true, purpose: 'essential' });
            }
            setPending([]);
            setAccepted({});
            window.location.reload(); // refaz as chamadas que haviam recebido 428
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="consent-title">
            <div className={styles.modal}>
                <h2 id="consent-title" className={styles.modal_title}>Atualizamos nossos termos</h2>
                <p className={styles.muted}>
                    Para continuar usando o Cadrius, leia e aceite as versões vigentes dos documentos abaixo.
                </p>
                {pending.map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <strong>{doc.title || KIND_LABEL[doc.kind] || doc.kind} <span className={styles.muted}>(v{doc.version})</span></strong>
                        {doc.content_md && <div className={styles.doc_text} tabIndex={0}><Markdown text={doc.content_md} /></div>}
                        <label className={styles.check_row}>
                            <input
                                type="checkbox"
                                checked={!!accepted[doc.id]}
                                onChange={(e) => setAccepted((a) => ({ ...a, [doc.id]: e.target.checked }))}
                            />
                            Li e aceito {KIND_LABEL[doc.kind] || 'este documento'} (versão {doc.version}).
                        </label>
                    </div>
                ))}
                {error && <Banner tone="error">{error}</Banner>}
                <div className={styles.btn_row} style={{ justifyContent: 'flex-end' }}>
                    <button className={`${styles.btn} ${styles.btn_primary}`} disabled={!allChecked || saving} onClick={submit}>
                        {saving ? 'Registrando…' : 'Aceitar e continuar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
