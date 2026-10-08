import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import s from './Portal.module.css';
import { leadsApi } from '../../services/cad223';
import { BrandMark } from '../../components/brand/BrandLogo';

const err = (e, fb) => e?.response?.data?.detail || fb;

// Formulário público de captação do escritório (CAD-223): sem login, com consentimento LGPD obrigatório.
export default function Captacao() {
    const { token } = useParams();
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [done, setDone] = useState('');
    const [busy, setBusy] = useState(false);
    const [f, setF] = useState({ nome: '', email: '', telefone: '', assunto: '', mensagem: '', consentimento: false, aceita_email: false, aceita_whatsapp: false, site: '' });
    useEffect(() => { leadsApi.publicForm(token).then(setForm).catch((e) => setError(err(e, 'Formulário indisponível.'))); }, [token]);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError('');
        try { setDone((await leadsApi.submitForm(token, f)).mensagem); } catch (ex) { setError(err(ex, 'Não foi possível enviar. Tente de novo.')); } finally { setBusy(false); }
    };
    if (!form && error) return <main className={s.page}><div className={`${s.wrap} ${s.error}`}><h1>Formulário indisponível</h1><p className={s.muted}>{error}</p></div></main>;
    if (!form) return <main className={s.page}><div className={s.wrap}><p className={s.muted}>Carregando…</p></div></main>;
    return (
        <main className={s.page}>
            <div className={s.wrap}>
                <header className={s.brand}><div><h1>{form.titulo}</h1><div className={s.muted}>{form.escritorio}</div></div></header>
                <section className={s.card}>
                    {done ? <p role="status">{done}</p> : (
                        <form className={s.form} onSubmit={submit}>
                            {form.apresentacao && <p className={s.muted}>{form.apresentacao}</p>}
                            <label>Seu nome<input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} autoComplete="name" /></label>
                            <label>E-mail<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></label>
                            <label>Telefone / WhatsApp<input inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} autoComplete="tel" /></label>
                            {form.assuntos.length > 0 && (
                                <label>Assunto<select value={f.assunto} onChange={(e) => setF({ ...f, assunto: e.target.value })}>
                                    <option value="">Escolha…</option>{form.assuntos.map((a) => <option key={a}>{a}</option>)}</select></label>
                            )}
                            <label>Conte brevemente o que precisa<textarea value={f.mensagem} maxLength={1000} onChange={(e) => setF({ ...f, mensagem: e.target.value })} /></label>
                            <label className={s.hp} aria-hidden="true">Site<input tabIndex={-1} autoComplete="off" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} /></label>
                            <label className={s.check}><input type="checkbox" checked={f.aceita_email} onChange={(e) => setF({ ...f, aceita_email: e.target.checked })} /> Aceito receber retorno por e-mail</label>
                            <label className={s.check}><input type="checkbox" checked={f.aceita_whatsapp} onChange={(e) => setF({ ...f, aceita_whatsapp: e.target.checked })} /> Aceito receber retorno por WhatsApp</label>
                            <label className={s.check}><input type="checkbox" required checked={f.consentimento} onChange={(e) => setF({ ...f, consentimento: e.target.checked })} /> {form.consentimento}</label>
                            {error && <p className={s.late} role="alert">{error}</p>}
                            <button type="submit" className={s.submit} disabled={busy}>Enviar</button>
                        </form>
                    )}
                </section>
                <footer className={s.powered}><BrandMark size={16} /> Feito com Cadrius</footer>
            </div>
        </main>
    );
}
