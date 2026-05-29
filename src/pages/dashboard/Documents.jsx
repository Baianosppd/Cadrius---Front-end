// src/components/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Documents.module.css';

import PageHeader from '../../components/ui/PageHearder.jsx';
import DropZone from '../../components/ui/DropZone.jsx';
import DocumentList from '../../components/ui/DocumentList.jsx';


function Documents() {

    const documents = [
        { name: 'Petição Inicial - Caso Silva', client: 'João Silva', type: 'Petição', date: '2024-05-15', status: 'concluido' },
        { name: 'Contrato de Prestação de Serviços', client: 'Empresa ABC', type: 'Contrato', date: '2024-05-14', status: 'processando' },
        { name: 'Recurso de Apelação', client: 'Maria Santos', type: 'Recurso', date: '2024-05-14', status: 'concluido' },
        { name: 'Acordo Extrajudicial', client: 'Pedro Costa', type: 'Acordo', date: '2024-05-13', status: 'erro' },
        { name: 'Parecer Jurídico - Tributário', client: 'Empresa XYZ', type: 'Parecer', date: '2024-05-13', status: 'concluido' },
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