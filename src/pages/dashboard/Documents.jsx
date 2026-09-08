import React from 'react';
import styles from './Documents.module.css';

import PageHeader from '../../components/ui/PageHearder.jsx';
import DropZone from '../../components/ui/DropZone.jsx';
import DocumentList from '../../components/ui/DocumentList.jsx';


function Documents() {

    // A listagem real de documentos ainda não é puxada do backend.
    const documents = [
        {
            name: 'Listagem de documentos em desenvolvimento',
            client: '—',
            type: 'Aguardando backend',
            date: '—',
            status: 'processando',
        },
    ];

    return (
        <div className={styles.documents_container}>

            <PageHeader title="Documentos" subtitle="Gerencie e analise seus documentos jurídicos" ></PageHeader>
            <DropZone></DropZone>
            <DocumentList documents={documents} />

        </div>
    );
}

export default Documents;