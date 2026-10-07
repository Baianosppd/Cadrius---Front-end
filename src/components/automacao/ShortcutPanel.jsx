import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCopy, FiWatch } from 'react-icons/fi';
import ui from '../seguranca/seguranca.module.css';
import { Banner, errorMessage } from '../seguranca/ui';
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
        <div className={ui.card} style={{ marginTop: 12, background: 'var(--c-surface-2)' }}>
            <div className={ui.section_title}><FiWatch aria-hidden="true" /> Atalho no relógio, celular ou voz</div>
            <p className={ui.muted} style={{ marginTop: 0 }}>Chame este link (método POST) para rodar a regra na hora. Dá para enviar um texto ditado,
                que vira a variável {'{{atalho.texto}}'}.</p>
            {url ? (
                <>
                    <Banner tone="warn">Guarde este link agora: por segurança ele não aparece de novo. Quem tiver o link aciona a regra.</Banner>
                    <div className={ui.btn_row} style={{ alignItems: 'center' }}>
                        <code style={{ wordBreak: 'break-all', fontSize: '.8rem', flex: 1 }}>{url}</code>
                        <button type="button" className={ui.btn} onClick={copy}><FiCopy aria-hidden="true" /> Copiar</button>
                    </div>
                </>
            ) : (
                <p className={ui.muted}>{rule.atalho_configurado ? 'O link já foi gerado e está valendo.' : 'Ainda não há link para esta regra.'}</p>
            )}
            {canManage && <button type="button" className={ui.btn} disabled={busy} onClick={make}>{rule.atalho_configurado ? 'Gerar link novo' : 'Gerar link do atalho'}</button>}
            <div className={ui.tabs} role="tablist" style={{ marginTop: 12 }}>
                {Object.entries(SHORTCUT_GUIDES).map(([k, v]) => (
                    <button key={k} type="button" role="tab" aria-selected={guide === k} className={`${ui.tab} ${guide === k ? ui.tab_active : ''}`}
                        onClick={() => setGuide(k)}>{v.label}</button>
                ))}
            </div>
            <ol style={{ margin: '8px 0 0', paddingLeft: 20, display: 'grid', gap: 4, fontSize: '.88rem' }}>
                {g.steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
        </div>
    );
}
