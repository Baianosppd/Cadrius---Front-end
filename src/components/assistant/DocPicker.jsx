import { useEffect, useState } from 'react';
import { FiFileText, FiSearch } from 'react-icons/fi';
import ui from '../seguranca/seguranca.module.css';
import api from '../../services/api';
import { errorMessage } from '../seguranca/ui';
import a from './Assistant.module.css';

// Escolher um documento do escritório para a IA usar na conversa (CAD-226)
export default function DocPicker({ onPick, onClose }) {
    const [q, setQ] = useState('');
    const [docs, setDocs] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        const t = setTimeout(() => {
            api.get('documentos/', { params: q.trim() ? { q: q.trim() } : {} })
                .then((r) => { setDocs(r.data.results ?? r.data); setError(''); })
                .catch((e) => setError(errorMessage(e)));
        }, 250);
        return () => clearTimeout(t);
    }, [q]);
    useEffect(() => {
        const esc = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', esc);
        return () => window.removeEventListener('keydown', esc);
    }, [onClose]);
    return (
        <div className={ui.overlay} role="dialog" aria-modal="true" aria-labelledby="docpick-title">
            <div className={ui.modal} style={{ maxWidth: 560, width: '100%' }}>
                <div id="docpick-title" className={ui.modal_title}>Usar um documento na conversa</div>
                <p className={ui.muted} style={{ marginTop: 0 }}>A IA lê o documento escolhido para extrair dados, resumir ou montar um plano de ação.</p>
                <label className={a.doc_search}>
                    <FiSearch aria-hidden="true" />
                    <input className={ui.input} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pelo nome" aria-label="Buscar documento" />
                </label>
                {error && <p className={ui.muted}>{error}</p>}
                <div className={a.doc_list}>
                    {docs === null && <p className={ui.muted}>Carregando…</p>}
                    {docs?.length === 0 && <p className={ui.muted}>Nenhum documento encontrado. Envie em Documentos.</p>}
                    {docs?.slice(0, 20).map((d) => (
                        <button key={d.id} type="button" className={a.doc_item} onClick={() => onPick({ id: d.id, nome: d.nome })}>
                            <FiFileText aria-hidden="true" /> <span><strong>{d.nome}</strong>
                                <small>{[d.tipo_display || d.tipo, d.data && new Date(d.data).toLocaleDateString('pt-BR')].filter(Boolean).join(' · ')}</small></span>
                        </button>
                    ))}
                </div>
                <div className={ui.btn_row} style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className={ui.btn} onClick={onClose}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}
