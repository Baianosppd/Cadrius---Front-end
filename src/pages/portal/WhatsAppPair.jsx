import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import s from './Portal.module.css';
import { PAIRING_STEPS, formatPairingCode, whatsappApi } from '../../services/whatsapp';

const err = (e, fb) => e?.response?.data?.detail || fb;

// Página pública (CAD-225): quem está com o celular do escritório abre o link e digita o código no WhatsApp.
export default function WhatsAppPair() {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let stop = false;
        const load = () => whatsappApi.publicPair(token)
            .then((d) => { if (!stop) { setData(d); setError(''); } })
            .catch((e) => { if (!stop) setError(err(e, 'Não foi possível carregar. Tente de novo.')); });
        load();
        const id = setInterval(load, 5000);
        return () => { stop = true; clearInterval(id); };
    }, [token]);

    if (error && !data) return <main className={s.page}><div className={`${s.wrap} ${s.error}`}><h1>Link indisponível</h1><p className={s.muted}>{error}</p></div></main>;
    if (!data) return <main className={s.page}><div className={s.wrap}><p className={s.muted}>Carregando…</p></div></main>;
    return (
        <main className={s.page}>
            <div className={s.wrap}>
                <header className={s.brand}><div><h1>Conectar o WhatsApp</h1><div className={s.muted}>{data.escritorio}</div></div></header>
                <section className={s.card}>
                    {data.estado === 'open' ? (
                        <p role="status"><strong>Pronto! O WhatsApp do escritório está conectado.</strong> Pode fechar esta página.</p>
                    ) : (
                        <>
                            <ol style={{ paddingLeft: 18, display: 'grid', gap: 8 }}>{PAIRING_STEPS.map((step) => <li key={step}>{step}</li>)}</ol>
                            <p className={s.muted}>Número com final {data.numero_final}</p>
                            <div aria-label="Código de pareamento" style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '.15em', textAlign: 'center', padding: '16px 0' }}>
                                {formatPairingCode(data.codigo_pareamento) || '…'}
                            </div>
                            <p className={s.muted}>Esta página confirma sozinha quando conectar. O código muda a cada poucos minutos; se expirar, a página mostra um novo.</p>
                        </>
                    )}
                    {error && <p className={s.muted} role="alert">{error}</p>}
                </section>
            </div>
        </main>
    );
}
