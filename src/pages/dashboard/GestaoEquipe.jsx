import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './GestaoEquipe.module.css';

import TabBar from '../../components/ui/TabBar.jsx';
import TeamMembers from '../../components/ui/TeamMembers.jsx';
import PermissionGroups from '../../components/ui/PermissionGroups.jsx';
import InviteMemberModal from '../../components/ui/InviteMemberModal.jsx';
import { toast } from 'react-toastify';

const mapMember = (member) => {
    const name = `${member.first_name} ${member.last_name}`.trim() || member.email;
    const nameParts = name.split(' ');
    const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : nameParts[0][0].toUpperCase();
    return {
        initials,
        name,
        email: member.email,
        isAdmin: ['administrador', 'owner'].includes(member.role),
        permission: member.role,
        creditsUsed: 0,
        creditsTotal: 1000,
    };
};

function GestaoEquipe() {
    const [activeTab, setActiveTab] = useState('funcionarios');
    const [members, setMembers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);

    useEffect(() => {
        api.get('teams/members/')
            .then(res => setMembers(res.data.map(mapMember)))
            .catch(err => console.error('Erro ao carregar membros:', err));

        api.get('teams/permission-groups/')
            .then(res => setGroups(res.data))
            .catch(err => console.error('Erro ao carregar grupos:', err));
    }, []);

    const handleInvite = async (data) => {
        try {
            const response = await api.post('teams/members/', {
                email: data.email,
                role: data.role,
            });
            setMembers(prev => [...prev, mapMember(response.data)]);
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
        { id: 'permissoes', label: 'Grupos de Permissão', count: groups.length },
    ];

    return (
        <div className={styles.GestaoEquipe_container}>
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
                    onInvite={() => setShowInviteModal(true)}
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