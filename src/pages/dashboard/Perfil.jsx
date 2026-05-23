// src/components/pages/Perfil.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';
// Reutilizamos o CSS do Card para manter a consistência ou criamos um inline simples
import styles from './Perfil.module.css';
import TextoCarregando from '../../components/ui/TextoCarregando';

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

        // Redireciona para o Login usando a navegação do React (Correção aplicada aqui)
        navigate('/login');
    };

    if (!user) return (
        <TextoCarregando text={'Carregando Perfil...'}></TextoCarregando>
    )

    return (
        <div className={styles.perfil_container}>

            <h2 className={styles.title}>
                Meu Perfil
            </h2>

            {/* Card de Informações */}
            <div className={styles.profile_card}>

                {/* Avatar */}
                <div className={styles.avatar}>
                    {user.initials}
                </div>

                {/* Dados */}
                <div className={styles.profile_data}>

                    <h3 className={styles.name}>
                        {user.first_name} {user.last_name}
                    </h3>

                    <p className={styles.email}>
                        {user.email}
                    </p>

                    <span className={styles.status_badge}>
                        Usuário Ativo
                    </span>

                </div>
            </div>

            {/* Botão de Logout */}
            <button
                onClick={handleLogout}
                className={styles.logout_button}
            >
                Sair do Sistema
            </button>

        </div>
    );
}

export default Perfil;