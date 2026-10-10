import { useEffect, useState } from 'react';
import api from '../../services/api';
import Markdown from '../seguranca/Markdown';

const KINDS = ['terms', 'privacy', 'ciencia'];
const LABEL = { terms: 'Termos de Uso', privacy: 'Política de Privacidade', ciencia: 'Termo de Ciência do Uso de Dados' };

// Aceite dos documentos legais vigentes no cadastro (LGPD). Guarda a VERSÃO exibida: o back confere e grava a prova.
export default function LegalAcceptance({ formData, onChange }) {
    const [docs, setDocs] = useState(null);
    const [open, setOpen] = useState(null);
    const legal = formData.legal || {};

    useEffect(() => {
        api.get('legal/documents/')
            .then((r) => setDocs(r.data.filter((d) => KINDS.includes(d.kind)).sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind))))
            .catch(() => setDocs([]));
    }, []);

    // Sem documentos publicados o back não exige aceite
    useEffect(() => {
        if (docs && docs.length === 0 && !formData.legalOk) onChange({ legalOk: true, legal: {} });
    }, [docs, formData.legalOk, onChange]);

    if (!docs || docs.length === 0) return null;

    const toggle = (doc, checked) => {
        const next = { ...legal };
        if (checked) next[doc.kind] = doc.version; else delete next[doc.kind];
        onChange({ legal: next, legalOk: docs.every((d) => next[d.kind] === d.version) });
    };

    return (
        <fieldset style={{ border: '1px solid var(--c-border)', borderRadius: 10, padding: 14, marginTop: 18 }}>
            <legend style={{ padding: '0 6px', fontWeight: 600 }}>Termos e privacidade</legend>
            {docs.map((d) => (
                <div key={d.id} style={{ marginBottom: 8 }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14 }}>
                        <input type="checkbox" checked={legal[d.kind] === d.version} onChange={(e) => toggle(d, e.target.checked)} />
                        <span>
                            Li e aceito {LABEL[d.kind]} (v{d.version}){' '}
                            <button type="button" onClick={() => setOpen(open === d.id ? null : d.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--c-primary)', cursor: 'pointer', padding: 0 }}>
                                {open === d.id ? 'ocultar' : 'ler'}
                            </button>
                        </span>
                    </label>
                    {open === d.id && (
                        <div tabIndex={0} style={{ fontSize: 13, maxHeight: 200, overflowY: 'auto', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 8, padding: 10, marginTop: 6 }}>
                            <Markdown text={d.content_md} />
                        </div>
                    )}
                </div>
            ))}
        </fieldset>
    );
}
