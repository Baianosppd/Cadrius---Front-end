import { useEffect, useState } from 'react';
import ui from '../ui/ui.module.css';
import { Banner, Button, Modal } from '../ui';
import { errorMessage } from '../../utils/format';
import { emailApi } from '../../services/emailVisual';

// Prévia do e-mail como o cliente vai receber (CAD-226). Mostrada num iframe isolado, sem scripts.
export function EmailFrame({ html, height = 460 }) {
    return <iframe title="Prévia do e-mail" sandbox="" srcDoc={html} className={ui.email_frame} style={{ height }} />;
}

export default function EmailPreview({ assunto, mensagem, visual, onClose }) {
    const [html, setHtml] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        emailApi.preview({ assunto, mensagem, visual }).then((r) => setHtml(r.html)).catch((e) => setError(errorMessage(e)));
    }, [assunto, mensagem, visual]);
    return (
        <Modal title={`Prévia do e-mail${assunto ? `: ${assunto}` : ''}`} size="lg" onClose={onClose}
            footer={<Button onClick={onClose}>Fechar</Button>}>
            <p className={`${ui.muted} ${ui.mt_0}`}>As variáveis (ex.: {'{{cliente.primeiro_nome}}'}) são trocadas pelos dados reais no envio.
                A assinatura é a de quem criou a regra ou confirmou o envio.</p>
            {error ? <Banner tone="error">{error}</Banner> : html ? <EmailFrame html={html} /> : <p className={ui.muted}>Montando a prévia…</p>}
        </Modal>
    );
}
