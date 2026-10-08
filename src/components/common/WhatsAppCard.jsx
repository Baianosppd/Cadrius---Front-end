import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCopy, FiLink, FiSmartphone } from 'react-icons/fi';
import ui from '../seguranca/seguranca.module.css';
import { Banner, Pill, errorMessage } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
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
        <section className={embedded ? '' : ui.card} aria-labelledby="wa-title">
            <div className={ui.btn_row} style={{ justifyContent: 'space-between' }}>
                <div id="wa-title" className={ui.section_title} style={embedded ? { display: 'none' } : undefined}><FiSmartphone aria-hidden="true" /> WhatsApp do escritório</div>
                {data.conectado ? <Pill tone="green">Conectado</Pill> : <Pill tone="gray">Não conectado</Pill>}
            </div>
            {data.conectado ? (
                <div className={ui.btn_row} style={{ justifyContent: 'space-between', marginTop: 8 }}>
                    <p className={ui.muted}>As automações e o aviso ao cliente já enviam por este número, só para quem autorizou WhatsApp.</p>
                    {isOrgManager && <button type="button" className={`${ui.btn} ${ui.btn_danger}`} onClick={disconnect}>Desconectar</button>}
                </div>
            ) : !isOrgManager ? (
                <p className={ui.muted}>Peça ao dono ou administrador do escritório para conectar o WhatsApp.</p>
            ) : (
                <div className={ui.stack} style={{ marginTop: 8 }}>
                    <p className={ui.muted}>Sem servidor e sem configuração técnica: informe o número e conecte pelo próprio celular.</p>
                    <form className={ui.btn_row} onSubmit={connect} style={{ alignItems: 'flex-end' }}>
                        <label className={ui.field} style={{ maxWidth: 260 }}>Número do WhatsApp (com DDD)
                            <input id="wa-numero" className={ui.input} inputMode="tel" placeholder="(11) 98888-7777" value={numero} onChange={(e) => setNumero(e.target.value)} required />
                        </label>
                        <button type="submit" className={`${ui.btn} ${ui.btn_primary}`} disabled={busy}>{busy ? 'Preparando…' : 'Conectar'}</button>
                        <button type="button" className={ui.btn} disabled={!numero} onClick={makeLink}><FiLink aria-hidden="true" /> Gerar link para o celular</button>
                    </form>
                    {link && (
                        <Banner tone="info">
                            Envie este link para quem está com o celular do escritório (vale 15 minutos):
                            <div className={ui.btn_row} style={{ marginTop: 6 }}>
                                <code style={{ wordBreak: 'break-all' }}>{link}</code>
                                <button type="button" className={`${ui.btn} ${ui.btn_sm}`} onClick={() => copy(link)}><FiCopy aria-hidden="true" /> Copiar</button>
                            </div>
                        </Banner>
                    )}
                    {pairing && (
                        <div className={ui.grid} style={{ alignItems: 'start' }}>
                            <div className={ui.stack}>
                                <strong>No celular do escritório</strong>
                                <ol className={ui.muted} style={{ margin: 0, paddingLeft: 18 }}>{PAIRING_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
                                {pairing.codigo_pareamento && (
                                    <div className={ui.btn_row}>
                                        <span aria-label="Código de pareamento" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '1.8rem', letterSpacing: '.15em', fontWeight: 700 }}>
                                            {formatPairingCode(pairing.codigo_pareamento)}
                                        </span>
                                        <button type="button" className={`${ui.btn} ${ui.btn_sm}`} onClick={() => copy(pairing.codigo_pareamento)}><FiCopy aria-hidden="true" /> Copiar</button>
                                    </div>
                                )}
                                <p className={ui.muted}>Aguardando o celular conectar… esta tela atualiza sozinha.</p>
                            </div>
                            {pairing.qrcode && (
                                <div className={ui.stack}>
                                    <strong>Ou leia o QR code de outro aparelho</strong>
                                    <img src={pairing.qrcode} alt="QR code para conectar o WhatsApp" width={220} height={220} style={{ background: '#fff', padding: 8, borderRadius: 8 }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
