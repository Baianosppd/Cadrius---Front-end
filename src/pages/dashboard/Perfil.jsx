import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';
import styles from './Perfil.module.css';

import ProfileInfo from '../../components/ui/ProfileInfo.jsx';
import ChangePassword from '../../components/ui/ChangePassword.jsx';
import PlanCard from '../../components/ui/Cards/PlanCard.jsx';
import { toast } from 'react-toastify';

function Perfil() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('auth/user/')
            .then(response => setUser(response.data))
            .catch(error => console.error("Erro ao carregar perfil:", error));
    }, []);

    const handleSave = async (data) => {
        try {
            const response = await api.put('auth/user/', {
                first_name: data.nome.split(' ')[0] || '',
                last_name: data.nome.split(' ').slice(1).join(' ') || '',
                phone: data.telefone,
                oab_number: data.oab,
            });
            setUser(response.data);
            toast.success('Perfil atualizado com sucesso!');
        } catch (err) {
            toast.error('Erro ao salvar perfil. Tente novamente.');
        }
    };


    const handlePhotoChange = async (file) => {
        try {
            const formData = new FormData();
            formData.append('profile_picture', file);  // 👈 era foto
            const response = await api.put('auth/user/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUser(response.data);
            toast.success('Foto atualizada com sucesso!');
        } catch (err) {
            toast.error('Erro ao atualizar foto. Tente novamente.');
        }
    };

    const plans = [
        { id: 'starter', name: 'Starter', price: 'Grátis', description: 'Limite de 10 documentos/mês', features: [] },
        { id: 'professional', name: 'Professional', price: 'R$ 99', billingDate: '23/06/2024', description: '', features: ['1.000 créditos', 'Gestão de Tarefas', 'Até 3 usuários', 'Integrações premium'] },
        { id: 'enterprise', name: 'Enterprise', price: 'R$ 249', description: 'Créditos ilimitados', features: [] },
    ];

    const currentPlanId = 'professional';
    const currentPlan = plans.find(p => p.id === currentPlanId);
    const otherPlans = plans.filter(p => p.id !== currentPlanId);

    return (
        <div className={styles.perfil_container}>
            {!user ? (
                <p style={{ padding: 32, color: '#6b7280' }}>Carregando perfil...</p>
            ) : (
                <>
                    <ProfileInfo
                        user={{
                            nome: `${user.first_name} ${user.last_name}`.trim() || '—',
                            email: user.email || '—',
                            telefone: user.phone || '—',
                            oab: user.oab_number || '—',
                            foto: user.profile_picture || null,
                            iniciais: user.initials || '??',
                        }}
                        onSave={handleSave}
                        onPhotoChange={handlePhotoChange}
                    />
                    <ChangePassword onSave={(data) => console.log(data)} />
                    <PlanCard
                        currentPlan={currentPlan}
                        otherPlans={otherPlans}
                        onManage={() => { }}
                    />
                </>
            )}
        </div>
    );
}

export default Perfil;