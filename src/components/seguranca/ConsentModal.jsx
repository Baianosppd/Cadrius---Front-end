import { useCallback, useEffect, useState } from 'react';
import api, { CONSENT_REQUIRED_EVENT } from '../../services/api';
import styles from '../ui/ui.module.css';
import { Banner, Button, Checkbox, Modal, Stack } from '../ui';
import { errorMessage } from '../../utils/format';
import Markdown from './Markdown';

const KIND_LABEL = { terms: 'Termos de Uso', privacy: 'Política de Privacidade', ciencia: 'Termo de Ciência do Uso de Dados' };

// Modal de reaceite (LGPD): abre quando há documentos novos pendentes (ao entrar) ou quando o back responde 428.
// O texto exibido é o da versão vigente; o aceite grava versão + hash no servidor (prova).
// Obrigatório: não fecha por Esc nem clique fora — só segue depois de aceitar.
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
        <Modal title="Atualizamos nossos termos" size="lg" closeOnOverlay={false} closeOnEsc={false} busy={saving}
            footer={<Button variant="primary" className={styles.ml_auto} disabled={!allChecked} loading={saving} loadingLabel="Registrando…" onClick={submit}>
                Aceitar e continuar</Button>}>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>
                Para continuar usando o Cadrius, leia e aceite as versões vigentes dos documentos abaixo.
            </p>
            {pending.map((doc) => (
                <Stack key={doc.id} gap={2}>
                    <strong>{doc.title || KIND_LABEL[doc.kind] || doc.kind} <span className={styles.muted}>(v{doc.version})</span></strong>
                    {doc.content_md && <div className={styles.doc_text} tabIndex={0}><Markdown text={doc.content_md} /></div>}
                    <Checkbox checked={!!accepted[doc.id]} onChange={(e) => setAccepted((a) => ({ ...a, [doc.id]: e.target.checked }))}>
                        Li e aceito {KIND_LABEL[doc.kind] || 'este documento'} (versão {doc.version}).
                    </Checkbox>
                </Stack>
            ))}
            {error && <Banner tone="error">{error}</Banner>}
        </Modal>
    );
}
