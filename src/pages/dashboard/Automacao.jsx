// src/components/pages/Automacao.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Automacao.module.css';
import Card from '../../components/ui/Card';


import NewAutomationModal from '../../components/common/NewAutomationModal';
import SimulationModal from '../../components/common/SimulationModal';
import TextoCarregando from '../../components/ui/TextoCarregando';
import BotaoIcone from '../../components/ui/BotaoIcone';
import SearchFilterBar from '../../components/ui/SearchFilterBar.jsx';
import SummaryGroup from '../../components/ui/Cards/SummaryGroup.jsx';
import AutomationSection from '../../components/ui/Cards/AutomationSection.jsx';
import Title from '../../components/ui/Title.jsx';

function Automacao() {

    return (
        <div className={styles.automacao_container}>

            <Title>Automações de fluxo de trabalho</Title>
            <SummaryGroup activeAutomations="4" totalExecutions="627" timeSaved="47h" />
            <SearchFilterBar></SearchFilterBar>
            <AutomationSection></AutomationSection>
        </div>
    );
}

export default Automacao;