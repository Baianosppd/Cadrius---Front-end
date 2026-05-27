// src/components/pages/Perfil.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';
// Reutilizamos o CSS do Card para manter a consistência ou criamos um inline simples
import styles from './Perfil.module.css';

import ProfileInfo from '../../components/ui/ProfileInfo.jsx';
import ChangePassword from '../../components/ui/ChangePassword.jsx';
import PlanCard from '../../components/ui/Cards/PlanCard.jsx';

function Perfil() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate(); // Agora está sendo usado na função handleLogout

    useEffect(() => {
        // Busca os dados do usuário logado
        api.get('auth/user/')
            .then(response => {
                setUser(response.data);
            })
            .catch(error => {
                console.error("Erro ao carregar perfil:", error);
            });
    }, []);

    const handleLogout = () => {
        // Limpa os tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        navigate('/login');
    };

    const plans = [
    {
        id: 'starter',
        name: 'Starter',
        price: 'Grátis',
        description: 'Limite de 10 documentos/mês',
        features: [],
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 'R$ 99',
        billingDate: '23/06/2024',
        description: '',
        features: ['1.000 créditos', 'Gestão de Tarefas', 'Até 3 usuários', 'Integrações premium'],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'R$ 249',
        description: 'Créditos ilimitados',
        features: [],
    },
];

const currentPlanId = 'professional';
const currentPlan = plans.find(p => p.id === currentPlanId);
const otherPlans = plans.filter(p => p.id !== currentPlanId);

    return (
        <div className={styles.perfil_container}>

            <ProfileInfo
                user={{
                nome: 'João da Silva',
                email: 'joao@empresa.com',
                telefone: '(11) 98765-4321',
                oab: 'SP 123456',
        }}
            onSave={(data) => console.log(data)}
        />
    <ChangePassword onSave={(data) => console.log(data)} />
    <PlanCard
        currentPlan={currentPlan}
        otherPlans={otherPlans}
        onManage={() => {}}
    />
        </div>
    );
}

export default Perfil;