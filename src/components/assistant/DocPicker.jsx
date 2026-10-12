import { useEffect, useState } from 'react';
import { FiFileText, FiSearch } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import { Button, Input, Loading, Modal } from '../ui';
import api from '../../services/api';
import { errorMessage } from '../../utils/format';
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
    return (
        <Modal title="Usar um documento na conversa" onClose={onClose} footer={<Button className={ui.ml_auto} onClick={onClose}>Cancelar</Button>}>
            <p className={`${ui.muted} ${ui.mt_0}`}>A IA lê o documento escolhido para extrair dados, resumir ou montar um plano de ação.</p>
            <label className={a.doc_search}>
                <FiSearch aria-hidden="true" />
                <Input className={ui.flex_1} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pelo nome" aria-label="Buscar documento" />
            </label>
            {error && <p className={ui.text_danger}>{error}</p>}
            <div className={a.doc_list}>
                {docs === null && !error && <Loading />}
                {docs?.length === 0 && <p className={ui.muted}>Nenhum documento encontrado. Envie em Documentos.</p>}
                {docs?.slice(0, 20).map((d) => (
                    <button key={d.id} type="button" className={a.doc_item} onClick={() => onPick({ id: d.id, nome: d.nome })}>
                        <FiFileText aria-hidden="true" /> <span><strong>{d.nome}</strong>
                            <small>{[d.tipo_display || d.tipo, d.data && new Date(d.data).toLocaleDateString('pt-BR')].filter(Boolean).join(' · ')}</small></span>
                    </button>
                ))}
            </div>
        </Modal>
    );
}
