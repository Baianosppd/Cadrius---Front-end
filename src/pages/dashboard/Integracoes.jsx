// src/components/pages/Integracoes.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Integracoes.module.css';

// Importação de todos os Modais de Configuração
import CredentialModal from '../../components/common/CredentialModal';
import MailboxModal from '../../components/common/MailboxModal';
import AIProfileModal from '../../components/common/AIProfileModal';
import Title from '../../components/ui/Title.jsx';
import IntegrationStatusBanner from '../../components/ui/Cards/IntegrationStatusBanner.jsx';
import SearchFilterBar from '../../components/ui/SearchFilterBar.jsx';
import IntegrationGroup from '../../components/ui/Cards/IntegrationGroup.jsx';


function Integracoes() {

    return (
        <div className={styles.integracoes_container}>

            <Title>Integrações</Title>
            <IntegrationStatusBanner
                connectedCount={1}
                totalCount={3}
            />
            <SearchFilterBar></SearchFilterBar>
            <IntegrationGroup></IntegrationGroup>
        </div>

    );
}

export default Integracoes;