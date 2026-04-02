// src/components/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Dashboard.module.css';

import AutomationActionCard from '../../components/ui/Cards/AutomationActionCard.jsx';
import SearchFilterBar from '../../components/ui/SearchFilterBar.jsx';
import UrgentDeadlines from '../../components/ui/Cards/UrgentDeadlines.jsx';
import AutomationSummary from '../../components/ui/Cards/AutomationSummary.jsx';
import Title from '../../components/ui/Title.jsx';

function BoxIA() {

    return (
        <div className={styles.BoxIA_container}>

            <Title>Visão Geral IA</Title>
            <AutomationSummary></AutomationSummary>
            <UrgentDeadlines></UrgentDeadlines>
            <SearchFilterBar></SearchFilterBar>
            <AutomationActionCard
                lawyerName="Dr. Carlos Mendes"
                lawyerEmail="carlos.mendes@advocacia.com.br"
                avatarUrl="link_da_foto.jpg"
                aiSummary="Cliente solicita recurso contra decisão desfavorável em ação trabalhista. Prazo para interposição se encerra em 3 dias úteis..."
                recommendation="Elaborar minuta de recurso ordinário com análise de jurisprudência."
            />
        </div>
    );
}

export default BoxIA;