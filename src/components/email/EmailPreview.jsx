import { useEffect, useState } from 'react';
import ui from '../seguranca/seguranca.module.css';
import { Banner, errorMessage } from '../seguranca/ui';
import { emailApi } from '../../services/emailVisual';

// Prévia do e-mail como o cliente vai receber (CAD-226). Mostrada num iframe isolado, sem scripts.
export function EmailFrame({ html, height = 460 }) {
    return <iframe title="Prévia do e-mail" sandbox="" srcDoc={html} style={{ width: '100%', height, border: '1px solid var(--c-border)', borderRadius: 10, background: '#f3f4f6' }} />;
}

export default function EmailPreview({ assunto, mensagem, visual, onClose }) {
    const [html, setHtml] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        emailApi.preview({ assunto, mensagem, visual }).then((r) => setHtml(r.html)).catch((e) => setError(errorMessage(e)));
    }, [assunto, mensagem, visual]);
    useEffect(() => {
        const esc = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', esc);
        return () => window.removeEventListener('keydown', esc);
    }, [onClose]);
    return (
        <div className={ui.overlay} role="dialog" aria-modal="true" aria-labelledby="email-prev-title">
            <div className={ui.modal} style={{ maxWidth: 720, width: '100%' }}>
                <div id="email-prev-title" className={ui.modal_title}>Prévia do e-mail{assunto ? `: ${assunto}` : ''}</div>
                <p className={ui.muted} style={{ marginTop: 0 }}>As variáveis (ex.: {'{{cliente.primeiro_nome}}'}) são trocadas pelos dados reais no envio.
                    A assinatura é a de quem criou a regra ou confirmou o envio.</p>
                {error ? <Banner tone="error">{error}</Banner> : html ? <EmailFrame html={html} /> : <p className={ui.muted}>Montando a prévia…</p>}
                <div className={ui.btn_row} style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                    <button type="button" className={ui.btn} onClick={onClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
}
