import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../seguranca/seguranca.module.css';
import { Banner, errorMessage } from '../seguranca/ui';
import { contactsApi } from '../../services/contacts';
import { integrationsApi } from '../../services/integrations';

// Enviar PDF para assinatura no ZapSign (CAD-174): signatários vêm do quadro de contatos
export default function AssinaturaModal({ documentId, documentName, onClose }) {
    const [q, setQ] = useState('');
    const [found, setFound] = useState([]);
    const [chosen, setChosen] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const search = async (e) => {
        e.preventDefault();
        try { setFound((await contactsApi.list({ q: q.trim() })).resultados || []); } catch (err) { setError({ msg: errorMessage(err) }); }
    };
    const toggle = (c) => setChosen((list) => (list.some((x) => x.id === c.id) ? list.filter((x) => x.id !== c.id) : [...list, c].slice(0, 10)));
    const send = async () => {
        setBusy(true); setError(null);
        try { setResult(await integrationsApi.signature({ documento_id: documentId, signatarios: chosen.map((c) => c.id) })); }
        catch (err) { setError({ msg: errorMessage(err), notConnected: err?.response?.data?.code === 'not_connected' }); } finally { setBusy(false); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="ass-title" onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
                <h2 id="ass-title" className={styles.modal_title}>Enviar para assinatura</h2>
                <p className={styles.muted} style={{ fontSize: '.88rem' }}>{documentName} · via ZapSign. Cada signatário recebe o link por e-mail.</p>
                {result ? (
                    <>
                        <Banner tone="ok">Documento enviado. Links individuais:</Banner>
                        {result.signatarios.map((s) => (
                            <div key={s.link || s.nome} className={styles.kv}><span>{s.nome}</span>
                                {s.link && <a href={s.link} target="_blank" rel="noreferrer noopener">abrir link</a>}</div>
                        ))}
                        <button type="button" className={styles.btn} onClick={onClose}>Fechar</button>
                    </>
                ) : (
                    <>
                        <form className={styles.filters} onSubmit={search}>
                            <label className={styles.field}>Buscar signatário no quadro de contatos
                                <input className={styles.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, CPF ou e-mail" /></label>
                            <button className={styles.btn}>Buscar</button>
                        </form>
                        {found.map((c) => (
                            <label key={c.id} className={styles.check_row}>
                                <input type="checkbox" checked={chosen.some((x) => x.id === c.id)} onChange={() => toggle(c)} disabled={!c.email && !c.phone} />
                                {c.name} <span className={styles.muted}>{c.email || c.phone || 'sem e-mail/telefone'}</span>
                            </label>
                        ))}
                        {chosen.length > 0 && <div className={styles.muted} style={{ fontSize: '.85rem' }}>Selecionados: {chosen.map((c) => c.name).join(', ')}</div>}
                        {error && <Banner tone="error">{error.msg} {error.notConnected && <Link to="/integracoes">Conectar o ZapSign</Link>}</Banner>}
                        <div className={styles.btn_row}>
                            <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || !chosen.length} onClick={send}>{busy ? 'Enviando…' : 'Enviar'}</button>
                            <button type="button" className={styles.btn} onClick={onClose}>Cancelar</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
