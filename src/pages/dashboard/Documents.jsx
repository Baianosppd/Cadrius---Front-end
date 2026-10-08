import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import styles from './Documents.module.css';

import PageHeader from '../../components/ui/PageHearder.jsx';
import DropZone from '../../components/ui/DropZone.jsx';
import DocumentList from '../../components/ui/DocumentList.jsx';
import { errorMessage } from '../../components/seguranca/ui';

const MAX_BYTES = 10 * 1024 * 1024; // igual ao limite anunciado na tela
const ALLOWED = ['pdf', 'doc', 'docx'];
const PAGE_SIZE = 10; // PAGE_SIZE do back

function Documents() {
    const [documents, setDocuments] = useState([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const load = useCallback(() => {
        api.get('documentos/', { params: { page, ...(search.trim() ? { q: search.trim() } : {}) } })
            .then((r) => { setDocuments(r.data.results ?? r.data); setCount(r.data.count ?? 0); })
            .catch((err) => toast.error(errorMessage(err, 'Não foi possível carregar os documentos.')))
            .finally(() => setLoading(false));
    }, [page, search]);

    useEffect(() => {
        const t = setTimeout(load, 250); // pequena espera ao digitar na busca
        return () => clearTimeout(t);
    }, [load]);

    const handleFiles = async (fileList) => {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        setUploading(true);
        let ok = 0;
        for (const file of files) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (!ALLOWED.includes(ext)) { toast.error(`${file.name}: formato não aceito (use PDF, DOC ou DOCX).`); continue; }
            if (file.size > MAX_BYTES) { toast.error(`${file.name}: maior que 10 MB.`); continue; }
            const form = new FormData();
            form.append('nome', file.name.replace(/\.[^.]+$/, ''));
            form.append('tipo', 'outro');
            form.append('status', 'processando');
            form.append('arquivo', file);
            try { await api.post('documentos/', form); ok += 1; }
            catch (err) { toast.error(`${file.name}: ${errorMessage(err)}`); }
        }
        setUploading(false);
        if (ok) { toast.success(`${ok} documento(s) enviado(s).`); setPage(1); load(); }
    };

    // O download exige o token: busca como blob e salva
    const handleDownload = async (doc) => {
        try {
            const r = await api.get(`documentos/${doc.id}/download/`, { responseType: 'blob' });
            const url = URL.createObjectURL(r.data);
            const a = document.createElement('a');
            a.href = url; a.download = doc.nome; a.click();
            URL.revokeObjectURL(url);
        } catch (err) { toast.error(errorMessage(err, 'Não foi possível baixar o arquivo.')); }
    };

    return (
        <div className={styles.documents_container}>
            <PageHeader title="Documentos" subtitle="Envie e a IA lê para você" />
            <DropZone onFileSelect={handleFiles} />
            {uploading && <p style={{ padding: '8px 0' }}>Enviando…</p>}
            <DocumentList
                documents={documents}
                search={search}
                onSearchChange={(v) => { setPage(1); setSearch(v); }}
                onDownload={handleDownload}
                page={page}
                pages={Math.max(1, Math.ceil(count / PAGE_SIZE))}
                onPage={setPage}
                loading={loading}
            />
        </div>
    );
}

export default Documents;
