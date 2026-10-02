import React, { useState, useEffect } from 'react';
import styles from './Documents.module.css';
import api from '../../services/api.js';

import PageHeader from '../../components/ui/PageHearder.jsx';
import DropZone from '../../components/ui/DropZone.jsx';
import DocumentList from '../../components/ui/DocumentList.jsx';


function Documents() {
    const [documents, setDocuments] = useState([]);

    useEffect(() => {
        api.get('documentos/')
            .then(res => {
                const items = res.data.results ?? res.data;
                setDocuments(items.map(doc => ({
                    id: doc.id,
                    name: doc.nome,
                    client: doc.cliente || '—',
                    type: doc.tipo,
                    date: doc.data,
                    status: doc.status,
                })));
            })
            .catch(err => console.error('Erro ao carregar documentos:', err));
    }, []);

    return (
        <div className={styles.documents_container}>

            <PageHeader title="Documentos" subtitle="Gerencie e analise seus documentos jurídicos" ></PageHeader>
            <DropZone></DropZone>
            <DocumentList documents={documents} />

        </div>
    );
}

export default Documents;