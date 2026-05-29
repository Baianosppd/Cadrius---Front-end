// src/components/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DocumentDetail.module.css';
import { FiArrowLeft, FiRefreshCw, FiDownload } from 'react-icons/fi';

import DocumentViewer from '../../components/ui/DocumentViewer';
import DocumentSummary from '../../components/ui/DocumentSummary';
import DocumentParties from '../../components/ui/DocumentParties';
import DocumentDeadlines from '../../components/ui/DocumentDeadlines';
import DocumentClauses from '../../components/ui/DocumentClauses';
import BackButton from '../../components/common/BackButton';


function DocumentDetail() {

    const navigate = useNavigate();

    const summary = 'Este documento trata de uma ação de cobrança movida por João Silva contra a empresa ABC Corp, referente a valores não pagos de serviços prestados no período de janeiro a março de 2024.';

    const parties = [
        { role: 'Autor', name: 'João Silva', document: 'CPF: 123.456.789-00' },
        { role: 'Réu', name: 'ABC Corp Ltda', document: 'CNPJ: 12.345.678/0001-90' },
    ];

    const deadlines = [
        { label: 'Prazo para contestação', days: 15 },
        { label: 'Audiência de conciliação', days: 31 },
        { label: 'Apresentação de documentos', days: 45 },
    ];

    const clauses = [
        { title: 'Cláusula de Juros Compostos', description: 'Possível abusividade na aplicação de juros compostos sobre o valor principal.', priority: 'Alta' },
        { title: 'Multa Contratual', description: 'Multa de 20% pode ser considerada excessiva pelo juízo.', priority: 'Média' },
    ];

    return (
        <div className={styles.DocumentDetail_container}>
            <BackButton label="Voltar para Dashboard" to="/dashboard" />

            <div className={styles.header}>
                <div className={styles.header_left}>
                    <h1 className={styles.title}>{document.name || 'Petição Inicial - Caso Silva'}</h1>
                    <div className={styles.meta}>
                        <span>{document.date || '15/05/2024'}</span>
                        <span className={styles.dot}>•</span>
                        <span>{document.size || '2.4 MB'}</span>
                        <span className={styles.dot}>•</span>
                        <span>{document.type || 'Petição'}</span>
                    </div>
                </div>
                <div className={styles.header_actions}>
                    <button className={styles.secondary_button}>
                        <FiRefreshCw className={styles.button_icon} />
                        Tentar Novamente
                    </button>
                    <button className={styles.secondary_button}>
                        <FiDownload className={styles.button_icon} />
                        Baixar
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.left}>
                    <DocumentViewer fileUrl={document.fileUrl || null} />
                </div>
                <div className={styles.right}>
                    <DocumentSummary summary={summary} />
                    <DocumentParties parties={parties} />
                    <DocumentDeadlines deadlines={deadlines} />
                    <DocumentClauses clauses={clauses} />
                </div>
            </div>
        </div>
    );
};
export default DocumentDetail;