import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiImage, FiTrash2 } from 'react-icons/fi';
import ui from '../seguranca/seguranca.module.css';
import { errorMessage } from '../seguranca/ui';
import { emailApi, readSignatureImage } from '../../services/emailVisual';
import { EmailFrame } from './EmailPreview';

const COLORS = ['#1d4ed8', '#0f766e', '#7c3aed', '#b45309', '#be123c', '#111827'];

// Perfil (CAD-226): assinatura dos e-mails (texto + imagem da assinatura ou logo) e, para dono/admin, o visual do escritório
export default function EmailSignatureCard() {
    const [sig, setSig] = useState(null);
    const [vis, setVis] = useState(null);
    const [html, setHtml] = useState('');
    const [busy, setBusy] = useState(false);
    const file = useRef(null);

    useEffect(() => {
        emailApi.signature().then(setSig).catch(() => setSig({ texto: '', imagem: '' }));
        emailApi.visual().then(setVis).catch(() => setVis(null));
    }, []);
    const preview = async (look = vis?.visual) => {
        try { setHtml((await emailApi.preview({ assunto: 'Prévia', visual: look })).html); } catch (e) { toast.error(errorMessage(e)); }
    };
    const logoFile = useRef(null);
    // CAD-231: logo da empresa, no topo de todos os e-mails do escritório (dono/admin)
    const pickLogo = async (e) => {
        try { const img = await readSignatureImage(e.target.files?.[0]); setVis((v) => ({ ...v, logo: img })); } catch (err) { toast.error(err.message); }
        e.target.value = '';
    };
    const pick = async (e) => {
        try { const img = await readSignatureImage(e.target.files?.[0]); setSig((s) => ({ ...s, imagem: img })); } catch (err) { toast.error(err.message); }
        e.target.value = '';
    };
    const save = async () => {
        setBusy(true);
        try {
            setSig(await emailApi.saveSignature(sig));
            if (vis?.pode_editar) setVis(await emailApi.saveVisual({ visual: vis.visual, cor: vis.cor, logo: vis.logo || '' }));
            toast.success('Assinatura salva. Ela entra nos e-mails que você enviar pelo Cadrius.');
            preview();
        } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
    };
    if (!sig) return null;
    return (
        <section aria-labelledby="sig-title" className={`${ui.card} ${ui.stack}`}>
            <div>
                <h2 id="sig-title" className={ui.section_title}>Assinatura dos e-mails</h2>
                <p className={ui.muted}>Entra no fim dos e-mails que você envia pelo Cadrius: avisos das automações que você criou,
                    mensagens confirmadas no Assistente e o link do portal do cliente. Sem ela, vale a assinatura do escritório.</p>
            </div>
            <label className={ui.field} htmlFor="sig-texto">Texto da assinatura
                <textarea id="sig-texto" className={ui.textarea} rows={4} maxLength={600} value={sig.texto}
                    placeholder={'Dra. Ana Andrade\nOAB/SP 123.456\nAndrade & Lima Advocacia · (11) 3333-4444'}
                    onChange={(e) => setSig({ ...sig, texto: e.target.value })} />
            </label>
            <div className={ui.btn_row} style={{ alignItems: 'center' }}>
                {sig.imagem && <img src={sig.imagem} alt="Imagem da assinatura" style={{ maxHeight: 60, maxWidth: 200, border: '1px solid var(--c-border)', borderRadius: 6, background: '#fff', padding: 4 }} />}
                <input ref={file} type="file" accept="image/png,image/jpeg" hidden onChange={pick} />
                <button type="button" className={ui.btn} onClick={() => file.current?.click()}><FiImage aria-hidden="true" /> {sig.imagem ? 'Trocar imagem' : 'Anexar assinatura ou logo'}</button>
                {sig.imagem && <button type="button" className={ui.btn} onClick={() => setSig({ ...sig, imagem: '' })}><FiTrash2 aria-hidden="true" /> Tirar imagem</button>}
                <span className={ui.muted}>PNG ou JPG até 200 KB (assinatura escaneada em fundo branco fica melhor).</span>
            </div>
            {vis?.pode_editar && (
                <div className={ui.stack}>
                    <div className={ui.field}>Logo da empresa</div>
                    <div className={ui.btn_row} style={{ alignItems: 'center' }}>
                        {vis.logo
                            ? <img src={vis.logo} alt="Logo da empresa" style={{ maxHeight: 48, maxWidth: 180, border: '1px solid var(--c-border)', borderRadius: 6, background: '#fff', padding: 4 }} />
                            : <span className={ui.muted}>Sem logo: o topo do e-mail mostra o nome do escritório.</span>}
                        <input ref={logoFile} type="file" accept="image/png,image/jpeg" hidden onChange={pickLogo} />
                        <button type="button" className={ui.btn} onClick={() => logoFile.current?.click()}><FiImage aria-hidden="true" /> {vis.logo ? 'Trocar logo' : 'Enviar logo'}</button>
                        {vis.logo && <button type="button" className={ui.btn} onClick={() => setVis({ ...vis, logo: '' })}><FiTrash2 aria-hidden="true" /> Tirar logo</button>}
                    </div>
                    <span className={ui.muted}>Entra no topo de todos os e-mails do escritório, em qualquer visual. PNG ou JPG até 200 KB, de preferência com fundo transparente.</span>
                    <div className={ui.field}>Visual dos e-mails do escritório</div>
                    <div className={ui.btn_row} role="radiogroup" aria-label="Visual dos e-mails">
                        {vis.opcoes.map((o) => (
                            <button key={o.id} type="button" role="radio" aria-checked={vis.visual === o.id}
                                className={`${ui.btn} ${vis.visual === o.id ? ui.btn_primary : ''}`}
                                onClick={() => { setVis({ ...vis, visual: o.id }); preview(o.id); }}>{o.label.split(' (')[0]}</button>
                        ))}
                    </div>
                    <div className={ui.btn_row} style={{ alignItems: 'center' }}>
                        <span className={ui.muted}>Cor:</span>
                        {COLORS.map((c) => (
                            <button key={c} type="button" aria-label={`Cor ${c}`} aria-pressed={vis.cor === c} onClick={() => setVis({ ...vis, cor: c })}
                                style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                                    border: vis.cor === c ? '3px solid var(--c-ring)' : '1px solid var(--c-border)' }} />
                        ))}
                        <input type="color" aria-label="Outra cor" value={vis.cor} onChange={(e) => setVis({ ...vis, cor: e.target.value })} />
                    </div>
                </div>
            )}
            <div className={ui.btn_row}>
                <button type="button" className={`${ui.btn} ${ui.btn_primary}`} onClick={save} disabled={busy}>{busy ? 'Salvando…' : vis?.pode_editar ? 'Salvar assinatura e visual' : 'Salvar assinatura'}</button>
                <button type="button" className={ui.btn} onClick={() => preview()}><FiEye aria-hidden="true" /> Ver como fica</button>
            </div>
            {html && <EmailFrame html={html} height={420} />}
        </section>
    );
}
