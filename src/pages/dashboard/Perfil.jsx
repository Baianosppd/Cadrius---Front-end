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
    const [currentPlan, setCurrentPlan] = useState(null);
    const [otherPlans, setOtherPlans] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('auth/user/')
            .then(response => setUser(response.data))
            .catch(error => console.error("Erro ao carregar perfil:", error));

        const billingBase = import.meta.env.VITE_API_URL.replace('api/v1/', '');
        api.get(`${billingBase}api/billing/plans/current/`)
            .then(res => {
                setCurrentPlan({
                    ...res.data.plano,
                    billingDate: res.data.proxima_cobranca || 'Sem data definida',
                });
                setOtherPlans(res.data.outros_planos);
            })
            .catch(err => console.error('Erro ao buscar plano atual:', err));
    }, []);

    const handleSave = async (data) => {
        try {
            const response = await api.patch('auth/profile/', {
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
            const response = await api.patch('auth/profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUser(response.data);
            toast.success('Foto atualizada com sucesso!');
        } catch (err) {
            toast.error('Erro ao atualizar foto. Tente novamente.');
        }
    };

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
                    {currentPlan && (
                        <PlanCard
                            currentPlan={currentPlan}
                            otherPlans={otherPlans}
                            onManage={() => { }}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default Perfil;