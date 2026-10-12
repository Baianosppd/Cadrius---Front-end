import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiImage, FiTrash2 } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import s from './Email.module.css';
import { Button, Field, Row, Segmented, Stack, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
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
    const logoFile = useRef(null);

    useEffect(() => {
        emailApi.signature().then(setSig).catch(() => setSig({ texto: '', imagem: '' }));
        emailApi.visual().then(setVis).catch(() => setVis(null));
    }, []);
    const preview = async (look = vis?.visual) => {
        try { setHtml((await emailApi.preview({ assunto: 'Prévia', visual: look })).html); } catch (e) { toast.error(errorMessage(e)); }
    };
    // CAD-231: logo da empresa, no topo de todos os e-mails do escritório (dono/admin)
    const pickLogo = async (e) => {
        try { const img = await readSignatureImage(e.target.files?.[0]); setVis((v) => ({ ...v, logo: img })); } catch (err) { toast.error(err.message); }
        e.target.value = '';
    };
    const pick = async (e) => {
        try { const img = await readSignatureImage(e.target.files?.[0]); setSig((x) => ({ ...x, imagem: img })); } catch (err) { toast.error(err.message); }
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
        <Stack as="section" aria-labelledby="sig-title" className={ui.card}>
            <div>
                <h2 id="sig-title" className={ui.section_title}>Assinatura dos e-mails</h2>
                <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>Entra no fim dos e-mails que você envia pelo Cadrius: avisos das automações que você criou,
                    mensagens confirmadas no Assistente e o link do portal do cliente. Sem ela, vale a assinatura do escritório.</p>
            </div>
            <Field label="Texto da assinatura">
                <Textarea rows={4} maxLength={600} value={sig.texto}
                    placeholder={'Dra. Ana Andrade\nOAB/SP 123.456\nAndrade & Lima Advocacia · (11) 3333-4444'}
                    onChange={(e) => setSig({ ...sig, texto: e.target.value })} />
            </Field>
            <Row>
                {sig.imagem && <img src={sig.imagem} alt="Imagem da assinatura" className={s.sig_img} />}
                <input ref={file} type="file" accept="image/png,image/jpeg" hidden onChange={pick} />
                <Button icon={FiImage} onClick={() => file.current?.click()}>{sig.imagem ? 'Trocar imagem' : 'Anexar assinatura ou logo'}</Button>
                {sig.imagem && <Button icon={FiTrash2} onClick={() => setSig({ ...sig, imagem: '' })}>Tirar imagem</Button>}
                <span className={ui.muted}>PNG ou JPG até 200 KB (assinatura escaneada em fundo branco fica melhor).</span>
            </Row>
            {vis?.pode_editar && (
                <Stack gap={3}>
                    <div className={ui.field}>Logo da empresa</div>
                    <Row>
                        {vis.logo
                            ? <img src={vis.logo} alt="Logo da empresa" className={s.logo_img} />
                            : <span className={ui.muted}>Sem logo: o topo do e-mail mostra o nome do escritório.</span>}
                        <input ref={logoFile} type="file" accept="image/png,image/jpeg" hidden onChange={pickLogo} />
                        <Button icon={FiImage} onClick={() => logoFile.current?.click()}>{vis.logo ? 'Trocar logo' : 'Enviar logo'}</Button>
                        {vis.logo && <Button icon={FiTrash2} onClick={() => setVis({ ...vis, logo: '' })}>Tirar logo</Button>}
                    </Row>
                    <span className={ui.muted}>Entra no topo de todos os e-mails do escritório, em qualquer visual. PNG ou JPG até 200 KB, de preferência com fundo transparente.</span>
                    <div className={ui.field}>Visual dos e-mails do escritório
                        <Segmented aria-label="Visual dos e-mails" value={vis.visual}
                            options={vis.opcoes.map((o) => ({ id: o.id, label: o.label.split(' (')[0] }))}
                            onChange={(id) => { setVis({ ...vis, visual: id }); preview(id); }} />
                    </div>
                    <Row role="group" aria-label="Cor dos e-mails">
                        <span className={ui.muted}>Cor:</span>
                        {COLORS.map((c) => (
                            <button key={c} type="button" aria-label={`Cor ${c}`} aria-pressed={vis.cor === c} onClick={() => setVis({ ...vis, cor: c })}
                                className={`${s.swatch} ${vis.cor === c ? s.swatch_on : ''}`} style={{ background: c }} />
                        ))}
                        <input type="color" aria-label="Outra cor" value={vis.cor} onChange={(e) => setVis({ ...vis, cor: e.target.value })} />
                    </Row>
                </Stack>
            )}
            <Row>
                <Button variant="primary" loading={busy} loadingLabel="Salvando…" onClick={save}>{vis?.pode_editar ? 'Salvar assinatura e visual' : 'Salvar assinatura'}</Button>
                <Button icon={FiEye} onClick={() => preview()}>Ver como fica</Button>
            </Row>
            {html && <EmailFrame html={html} height={420} />}
        </Stack>
    );
}
