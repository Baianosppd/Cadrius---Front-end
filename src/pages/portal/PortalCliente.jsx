import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import s from './Portal.module.css';
import { brl, portalApi } from '../../services/carteira';
import { BrandMark } from '../../components/brand/BrandLogo';

const date = (v) => (v ? new Date(v).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '');
const day = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

// Portal do cliente (CAD-175): página pública, só com o link pessoal. Mostra apenas o que é do cliente.
export default function PortalCliente() {
    const { token } = useParams();
    const [state, setState] = useState({ data: null, error: null });
    useEffect(() => {
        let live = true;
        portalApi.access(token).then((data) => live && setState({ data, error: null }))
            .catch((err) => live && setState({ data: null, error: err?.response?.data?.detail || 'Não foi possível abrir. Tente de novo em instantes.' }));
        return () => { live = false; };
    }, [token]);
    const { data, error } = state;
    if (error) return <main className={s.page}><div className={`${s.wrap} ${s.error}`}><h1>Acesso indisponível</h1><p className={s.muted}>{error}</p></div></main>;
    if (!data) return <main className={s.page}><div className={s.wrap}><p className={s.muted}>Carregando…</p></div></main>;
    return (
        <main className={s.page}>
            <div className={s.wrap}>
                <header className={s.brand}>
                    <div><h1>Olá, {data.cliente}!</h1><div className={s.muted}>Acompanhamento preparado por <strong>{data.escritorio}</strong></div></div>
                    <div className={s.muted}>Link válido até {date(data.valido_ate)}</div>
                </header>
                {data.honorarios && data.honorarios.length > 0 && (
                    <section className={s.card} aria-labelledby="hon">
                        <h2 id="hon">Honorários em aberto</h2>
                        {data.honorarios.map((h, i) => (
                            <div key={i} className={s.fee}>
                                <div><strong>{h.descricao}</strong><div className={h.vencido ? s.late : s.muted}>{h.vencido ? 'Vencido em ' : 'Vence em '}{day(h.vencimento)}</div></div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <strong>{brl(h.valor_centavos)}</strong>
                                    {h.link_pagamento && <a className={s.pay} href={h.link_pagamento} target="_blank" rel="noreferrer noopener">Pagar</a>}
                                </div>
                            </div>
                        ))}
                    </section>
                )}
                {data.processos.length === 0 && <section className={s.card}><p className={s.muted}>Nenhum processo vinculado a você ainda. Em caso de dúvida, fale com o escritório.</p></section>}
                {data.processos.map((p) => (
                    <section key={p.cnj} className={s.card} aria-label={`Processo ${p.cnj}`}>
                        <h2>Processo {p.cnj}</h2>
                        <div className={s.muted}>{p.tribunal}{p.ultima_movimentacao ? ` · última movimentação em ${date(p.ultima_movimentacao)}` : ''}</div>
                        {p.andamentos.length === 0 ? <p className={s.muted}>Ainda sem andamentos registrados.</p> : (
                            <ol className={s.timeline}>
                                {p.andamentos.map((a, i) => (
                                    <li key={i} className={a.reconhecido ? '' : s.unknown}>
                                        <div className={s.date}>{date(a.data)}</div>
                                        <div>{a.explicacao}</div>
                                        <div className={s.orig}>No tribunal: {a.original}</div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>
                ))}
                <p className={s.muted}>As explicações são simplificadas e não substituem a orientação do seu advogado. Este link é pessoal: não o compartilhe.</p>
                <footer className={s.powered}><BrandMark size={16} /> Feito com Cadrius</footer>
            </div>
        </main>
    );
}
