import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import s from './Portal.module.css';
import { leadsApi } from '../../services/cad223';
import { BrandMark } from '../../components/brand/BrandLogo';

const err = (e, fb) => e?.response?.data?.detail || fb;

// Pesquisa de satisfação (NPS) — página pública, link único enviado ao cliente (CAD-223)
export default function Pesquisa() {
    const { token } = useParams();
    const [info, setInfo] = useState(null);
    const [error, setError] = useState('');
    const [nota, setNota] = useState(null);
    const [comentario, setComentario] = useState('');
    const [done, setDone] = useState('');
    useEffect(() => { leadsApi.publicSurvey(token).then(setInfo).catch((e) => setError(err(e, 'Pesquisa indisponível.'))); }, [token]);
    const send = async () => {
        try { setDone((await leadsApi.answerSurvey(token, { nota, comentario })).mensagem); } catch (e) { setError(err(e, 'Não foi possível enviar.')); }
    };
    if (!info) return <main className={s.page}><div className={`${s.wrap} ${error ? s.error : ''}`}><p className={s.muted}>{error || 'Carregando…'}</p></div></main>;
    return (
        <main className={s.page}>
            <div className={s.wrap}>
                <header className={s.brand}><div><h1>Sua opinião</h1><div className={s.muted}>{info.escritorio}</div></div></header>
                <section className={s.card}>
                    {done || info.respondida ? <p role="status">{done || 'Esta pesquisa já foi respondida. Obrigado!'}</p> : (
                        <div className={s.form}>
                            <p id="q"><strong>{info.pergunta}</strong></p>
                            <div className={s.scale} role="group" aria-labelledby="q">
                                {Array.from({ length: 11 }, (_, i) => <button key={i} type="button" aria-pressed={nota === i} onClick={() => setNota(i)}>{i}</button>)}
                            </div>
                            <div className={`${s.scale_labels} ${s.muted}`}><span>Nada provável</span><span>Muito provável</span></div>
                            <label>Quer contar o motivo? (opcional)<textarea value={comentario} maxLength={1000} onChange={(e) => setComentario(e.target.value)} /></label>
                            {error && <p className={s.late} role="alert">{error}</p>}
                            <button type="button" className={s.submit} disabled={nota === null} onClick={send}>Enviar avaliação</button>
                        </div>
                    )}
                </section>
                <footer className={s.powered}><BrandMark size={16} /> Feito com Cadrius</footer>
            </div>
        </main>
    );
}
