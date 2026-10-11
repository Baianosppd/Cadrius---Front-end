import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCopy, FiLink, FiSmartphone } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import s from './Integracoes.module.css';
import { Banner, Button, Field, FilterBar, Input, Pill, Row, Stack } from '../ui';
import { errorMessage } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
import useAuth from '../../hooks/useAuth';
import { PAIRING_STEPS, formatPairingCode, whatsappApi } from '../../services/whatsapp';

// WhatsApp do escritório sem servidor próprio (CAD-225): número → QR code ou código → conectado.
export default function WhatsAppCard({ embedded = false }) {
    const { isOrgManager } = useAuth();
    const { data, reload } = useLoader(() => whatsappApi.status(), []);
    const [numero, setNumero] = useState('');
    const [pairing, setPairing] = useState(null);
    const [link, setLink] = useState('');
    const [busy, setBusy] = useState(false);
    const timer = useRef(null);

    // Enquanto mostra o código, confere a cada 4 s se o celular já conectou.
    useEffect(() => {
        if (!pairing) return undefined;
        timer.current = setInterval(async () => {
            try {
                const st = await whatsappApi.status();
                if (st.conectado) { clearInterval(timer.current); setPairing(null); setLink(''); toast.success('WhatsApp conectado!'); reload(); }
            } catch { /* tenta de novo no próximo ciclo */ }
        }, 4000);
        return () => clearInterval(timer.current);
    }, [pairing, reload]);

    const connect = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const r = await whatsappApi.connect(numero);
            if (r.estado === 'open') { toast.success('WhatsApp já está conectado.'); reload(); } else setPairing(r);
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const makeLink = async () => {
        try { setLink((await whatsappApi.link(numero)).link); } catch (err) { toast.error(errorMessage(err)); }
    };
    const copy = (text) => navigator.clipboard.writeText(text).then(() => toast.success('Copiado.')).catch(() => toast.info(text));
    const disconnect = async () => {
        if (!window.confirm('Desconectar o WhatsApp do escritório? As automações param de enviar por ele.')) return;
        try { await whatsappApi.disconnect(); toast.success('WhatsApp desconectado.'); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };

    if (!data || !data.disponivel) return null;          // sem servidor hospedado: segue valendo a conexão manual (Evolution própria) abaixo
    return (
        <Stack gap={3} as="section" className={embedded ? '' : ui.card} aria-label="WhatsApp do escritório">
            <Row justify="between">
                {!embedded && <Row gap={2} className={`${ui.section_title} ${ui.mb_0}`}><FiSmartphone aria-hidden="true" /> WhatsApp do escritório</Row>}
                {data.conectado ? <Pill tone="green">Conectado</Pill> : <Pill tone="gray">Não conectado</Pill>}
            </Row>
            {data.conectado ? (
                <Row justify="between">
                    <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>As automações e o aviso ao cliente já enviam por este número, só para quem autorizou WhatsApp.</p>
                    {isOrgManager && <Button variant="danger" onClick={disconnect}>Desconectar</Button>}
                </Row>
            ) : !isOrgManager ? (
                <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>Peça ao dono ou administrador do escritório para conectar o WhatsApp.</p>
            ) : (
                <Stack gap={3}>
                    <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>Sem servidor e sem configuração técnica: informe o número e conecte pelo próprio celular.</p>
                    <FilterBar as="form" onSubmit={connect}>
                        <Field label="Número do WhatsApp (com DDD)" className={s.field_phone}>
                            <Input inputMode="tel" placeholder="(11) 98888-7777" value={numero} onChange={(e) => setNumero(e.target.value)} required />
                        </Field>
                        <Button type="submit" variant="primary" loading={busy} loadingLabel="Preparando…">Conectar</Button>
                        <Button icon={FiLink} disabled={!numero} onClick={makeLink}>Gerar link para o celular</Button>
                    </FilterBar>
                    {link && (
                        <Banner tone="info">
                            Envie este link para quem está com o celular do escritório (vale 15 minutos):
                            <Row className={ui.mt_2}>
                                <code className={ui.break_all}>{link}</code>
                                <Button size="sm" icon={FiCopy} onClick={() => copy(link)}>Copiar</Button>
                            </Row>
                        </Banner>
                    )}
                    {pairing && (
                        <div className={`${ui.grid} ${ui.align_start}`}>
                            <Stack gap={3}>
                                <strong>No celular do escritório</strong>
                                <ol className={`${ui.muted} ${ui.list_indent}`}>{PAIRING_STEPS.map((step) => <li key={step}>{step}</li>)}</ol>
                                {pairing.codigo_pareamento && (
                                    <Row>
                                        <span aria-label="Código de pareamento" className={s.pair_code}>{formatPairingCode(pairing.codigo_pareamento)}</span>
                                        <Button size="sm" icon={FiCopy} onClick={() => copy(pairing.codigo_pareamento)}>Copiar</Button>
                                    </Row>
                                )}
                                <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>Aguardando o celular conectar… esta tela atualiza sozinha.</p>
                            </Stack>
                            {pairing.qrcode && (
                                <Stack gap={3}>
                                    <strong>Ou leia o QR code de outro aparelho</strong>
                                    <img src={pairing.qrcode} alt="QR code para conectar o WhatsApp" width={220} height={220} className={s.qr} />
                                </Stack>
                            )}
                        </div>
                    )}
                </Stack>
            )}
        </Stack>
    );
}
