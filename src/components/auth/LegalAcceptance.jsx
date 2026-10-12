import { useEffect, useState } from 'react';
import api from '../../services/api';
import ui from '../ui/ui.module.css';
import s from './LegalAcceptance.module.css';
import { Checkbox, Row } from '../ui';
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
        <fieldset className={s.box}>
            <legend className={s.legend}>Termos e privacidade</legend>
            {docs.map((d) => (
                <div key={d.id} className={s.item}>
                    {/* O botão "ler" fica fora do <label> para não marcar a caixa ao abrir o texto */}
                    <Row gap={2} align="start">
                        <Checkbox className={s.check} checked={legal[d.kind] === d.version} onChange={(e) => toggle(d, e.target.checked)}>
                            Li e aceito {LABEL[d.kind]} (v{d.version})
                        </Checkbox>
                        <button type="button" className={ui.link_btn} aria-expanded={open === d.id} onClick={() => setOpen(open === d.id ? null : d.id)}>
                            {open === d.id ? 'ocultar' : 'ler'}
                        </button>
                    </Row>
                    {open === d.id && (
                        <div tabIndex={0} className={s.doc}>
                            <Markdown text={d.content_md} />
                        </div>
                    )}
                </div>
            ))}
        </fieldset>
    );
}
