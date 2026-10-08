import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api.js';
import { PageHeader } from '../../components/seguranca/ui';
import styles from './GestaoEquipe.module.css';

import TabBar from '../../components/ui/TabBar.jsx';
import TeamMembers from '../../components/ui/TeamMembers.jsx';
import { AccessGroups, AccessReference } from '../../components/equipe/AccessGroups.jsx';
import useAuth from '../../hooks/useAuth';
import InviteMemberModal from '../../components/ui/InviteMemberModal.jsx';
import { toast } from 'react-toastify';

const mapMember = (m) => ({
    ...m,
    nome: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email,
});

function GestaoEquipe() {
    const [activeTab, setActiveTab] = useState('funcionarios');
    const [members, setMembers] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const { isOrgManager } = useAuth();

    const [summary, setSummary] = useState(null);
    // CAD-225: uso real de créditos (por pessoa e do escritório)
    const load = useCallback(() => {
        api.get('teams/members/').then(res => setMembers(res.data.map(mapMember))).catch(err => console.error('Erro ao carregar membros:', err));
        api.get('teams/credits/').then(res => setSummary(res.data)).catch(() => setSummary(null));
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleInvite = async (data) => {
        try {
            const response = await api.post('teams/members/', {
                email: data.email,
                role: data.role,
            });
            setMembers(prev => [...prev, mapMember(response.data)]);
            load();
            setShowInviteModal(false);
            toast.success('Funcionário convidado com sucesso!');
        } catch (err) {
            const data = err.response?.data;
            console.error('Erro ao convidar membro:', data);
            let detail;
            if (typeof data === 'string') {
                detail = data;
            } else if (data?.detail) {
                detail = data.detail;
            } else {
                const raw = data?.email ?? data?.role ?? data?.non_field_errors ?? Object.values(data || {})[0];
                detail = Array.isArray(raw) ? raw[0] : raw;
            }
            toast.error(detail || 'Erro ao convidar funcionário.');
        }
    };

    const tabs = [
        { id: 'funcionarios', label: 'Funcionários', count: members.length },
        ...(isOrgManager ? [{ id: 'permissoes', label: 'Grupos de acesso' }] : []),
        { id: 'referencia', label: 'O que cada acesso libera' },
    ];

    return (
        <div className={styles.GestaoEquipe_container}>
            <PageHeader title="Equipe" subtitle="Pessoas, acessos e créditos de IA" />
            {showInviteModal && (
                <InviteMemberModal
                    onClose={() => setShowInviteModal(false)}
                    onSave={handleInvite}
                />
            )}

            <TabBar
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {activeTab === 'funcionarios' && (
                <TeamMembers
                    members={members}
                    summary={summary}
                    canManage={isOrgManager}
                    onInvite={() => setShowInviteModal(true)}
                    onChanged={load}
                />
            )}

            {activeTab === 'permissoes' && isOrgManager && <AccessGroups />}
            {activeTab === 'referencia' && <AccessReference />}
        </div>
    );
}

export default GestaoEquipe;