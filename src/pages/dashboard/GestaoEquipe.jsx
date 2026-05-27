// src/components/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './GestaoEquipe.module.css';

import TabBar from '../../components/ui/TabBar.jsx';
import TeamMembers from '../../components/ui/TeamMembers.jsx';
import PermissionGroups from '../../components/ui/PermissionGroups.jsx';

function GestaoEquipe() {

    //Apagar consts quando conectar com o banco

    const [activeTab, setActiveTab] = useState('funcionarios');

    const tabs = [
        { id: 'funcionarios', label: 'Funcionários', count: 4 },
        { id: 'permissoes', label: 'Grupos de Permissão', count: 3 },
    ];

    const members = [
        { initials: 'JS', name: 'João Silva', isAdmin: true, email: 'joao@empresa.com', permission: 'Admin', creditsUsed: 450, creditsTotal: 2000 },
        { initials: 'MS', name: 'Maria Santos', isAdmin: false, email: 'maria@empresa.com', permission: 'Advogado Pleno', creditsUsed: 320, creditsTotal: 1000 },
        { initials: 'PC', name: 'Pedro Costa', isAdmin: false, email: 'pedro@empresa.com', permission: 'Advogado Pleno', creditsUsed: 180, creditsTotal: 1000 },
        { initials: 'AO', name: 'Ana Oliveira', isAdmin: false, email: 'ana@empresa.com', permission: 'Estagiário', creditsUsed: 45, creditsTotal: 200 },
    ];

    const groups = [
        {
            name: 'Admin',
            description: 'Acesso total ao sistema',
            permissions: ['Ver documentos', 'Criar documentos', 'Deletar documentos', 'Ver automações', 'Criar automações', 'Ver equipe', 'Gerenciar equipe', 'Ver integrações', 'Configurar integrações', 'Configurações gerais'],
        },
        {
            name: 'Advogado Pleno',
            description: 'Acesso às funcionalidades principais',
            permissions: ['Ver documentos', 'Criar documentos', 'Ver automações', 'Criar automações', 'Ver equipe', 'Ver integrações'],
        },
        {
            name: 'Estagiário',
            description: 'Acesso limitado para estagiários',
            permissions: ['Ver documentos', 'Criar documentos', 'Ver automações'],
        },
    ];

    return (
        <div className={styles.GestaoEquipe_container}>

            <TabBar
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {activeTab === 'funcionarios' && (
                <TeamMembers
                    members={members}
                    onInvite={() => { }}
                />
            )}

            {activeTab === 'permissoes' && (
                <PermissionGroups
                    groups={groups}
                    onCreateGroup={() => { }}
                />
            )}

        </div>
    );
}

export default GestaoEquipe;