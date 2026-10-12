import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCopy, FiWatch } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import { Banner, Button, Row, Stack, Tabs } from '../ui';
import { errorMessage } from '../../utils/format';
import { SHORTCUT_GUIDES, rulesApi } from '../../services/rules';

// Gatilho "Atalho" (CAD-226): link secreto da regra + passo a passo para relógio, celular e voz
export default function ShortcutPanel({ rule, canManage }) {
    const [url, setUrl] = useState('');
    const [guide, setGuide] = useState('apple');
    const [busy, setBusy] = useState(false);
    const make = async () => {
        if (rule.atalho_configurado && !window.confirm('Gerar um link novo? O link atual deixa de funcionar nos aparelhos já configurados.')) return;
        setBusy(true);
        try { setUrl((await rulesApi.shortcut(rule.id)).url); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
    };
    const copy = async () => {
        try { await navigator.clipboard.writeText(url); toast.success('Link copiado.'); } catch { toast.error('Selecione o link e copie.'); }
    };
    const g = SHORTCUT_GUIDES[guide];
    return (
        <Stack gap={3} className={`${ui.card} ${ui.bg_soft} ${ui.mt_3}`}>
            <Row gap={2} className={`${ui.section_title} ${ui.mb_0}`}><FiWatch aria-hidden="true" /> Atalho no relógio, celular ou voz</Row>
            <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>Chame este link (método POST) para rodar a regra na hora. Dá para enviar um texto ditado,
                que vira a variável {'{{atalho.texto}}'}.</p>
            {url ? (
                <>
                    <Banner tone="warn">Guarde este link agora: por segurança ele não aparece de novo. Quem tiver o link aciona a regra.</Banner>
                    <Row wrap={false}>
                        <code className={`${ui.mono} ${ui.break_all} ${ui.flex_1}`}>{url}</code>
                        <Button icon={FiCopy} onClick={copy}>Copiar</Button>
                    </Row>
                </>
            ) : (
                <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>{rule.atalho_configurado ? 'O link já foi gerado e está valendo.' : 'Ainda não há link para esta regra.'}</p>
            )}
            {canManage && <Button className={ui.w_fit} loading={busy} onClick={make}>{rule.atalho_configurado ? 'Gerar link novo' : 'Gerar link do atalho'}</Button>}
            <div>
                <Tabs tabs={Object.entries(SHORTCUT_GUIDES).map(([id, v]) => ({ id, label: v.label }))} value={guide} onChange={setGuide} />
                <ol className={ui.ol_compact}>
                    {g.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
            </div>
        </Stack>
    );
}
