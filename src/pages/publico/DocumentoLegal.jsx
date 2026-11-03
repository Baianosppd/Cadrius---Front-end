import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Markdown from '../../components/seguranca/Markdown';
import BrandLogo from '../../components/brand/BrandLogo';
import s from './DocumentoLegal.module.css';

const OTHER = {
    privacy: { to: '/termos-de-uso', label: 'Termos de Uso' },
    terms: { to: '/politica-de-privacidade', label: 'Política de Privacidade' },
};

// Política de Privacidade e Termos de Uso abertos a qualquer pessoa, sem login (verificação do app OAuth no Google).
// O texto é a versão vigente publicada no back (privacy.LegalDocument); a política também lista os suboperadores.
export default function DocumentoLegal({ kind = 'privacy' }) {
    // Resultado guardado com o tipo: ao trocar de documento, o anterior some sem precisar limpar o estado no efeito
    const [loaded, setLoaded] = useState({ kind: null, doc: null });
    const [subs, setSubs] = useState([]);

    useEffect(() => {
        api.get('legal/documents/')
            .then((r) => setLoaded({ kind, doc: r.data.find((x) => x.kind === kind) || null }))
            .catch(() => setLoaded({ kind, doc: null }));
        if (kind === 'privacy') api.get('legal/subprocessors/').then((r) => setSubs(r.data)).catch(() => setSubs([]));
    }, [kind]);

    const ready = loaded.kind === kind;
    const doc = ready ? loaded.doc : null;
    const error = ready && !doc;

    const other = OTHER[kind];
    return (
        <main className={s.page}>
            <div className={s.wrap}>
                <header className={s.top}>
                    <Link to="/" aria-label="Cadrius: página inicial"><BrandLogo size={30} /></Link>
                    <nav className={s.nav} aria-label="Documentos legais">
                        {other && <Link to={other.to}>{other.label}</Link>}
                        <Link to="/">Entrar</Link>
                    </nav>
                </header>
                <article className={s.card}>
                    {!doc && !error && <p className={s.muted} role="status">Carregando…</p>}
                    {error && (
                        <p role="alert">Não foi possível carregar o documento agora. Tente de novo em instantes ou escreva para{' '}
                            <a href="mailto:privacidade@cadrius.ia.br">privacidade@cadrius.ia.br</a>.</p>
                    )}
                    {doc && (
                        <>
                            <Markdown text={doc.content_md} semantic />
                            <p className={s.muted}>Versão {doc.version}, publicada em {new Date(doc.published_at).toLocaleDateString('pt-BR')}.</p>
                        </>
                    )}
                    {doc && subs.length > 0 && (
                        <section aria-labelledby="subs">
                            <h2 id="subs" className={s.subs_title}>Suboperadores</h2>
                            <div className={s.table_wrap}>
                                <table className={s.table}>
                                    <thead><tr><th>Empresa</th><th>País</th><th>Finalidade</th></tr></thead>
                                    <tbody>{subs.map((x) => <tr key={x.name}><td>{x.name}</td><td>{x.country}</td><td>{x.purpose}</td></tr>)}</tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </article>
                <footer className={s.foot}>Cadrius · <a href="mailto:privacidade@cadrius.ia.br">privacidade@cadrius.ia.br</a></footer>
            </div>
        </main>
    );
}
