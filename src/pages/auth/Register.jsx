import React, { useState } from 'react';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';

import InputPadrao from '../../components/ui/InputPadrao';
import BotaoLogin from '../../components/ui/BotaoLogin';


function Register() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await api.post('auth/register/', formData);
            alert('Cadastro realizado com sucesso!');
            navigate('/');
        } catch (err) {
            console.error("Erro no cadastro:", err);
            const msg = err.response?.data?.email?.[0] || 'Erro ao criar conta.';
            setError(msg);
        }
    };



    // ... (Restante do código JS) ...

    return (
        // 1. Container Principal (Fundo Escuro)
        <div className={styles.register_container}>

            {/* 2. Card de Registro (Container Arredondado com Neon) */}
            <div className={styles.register_card}>

                {/* Cabeçalho da Página */}
                <div className={styles.header_section}>
                    <h2 className={styles.title}>CRIAR CONTA</h2>
                    <p className={styles.subtitle}>Junte-se à plataforma Cadrius</p>
                </div>

                {/* 3. Formulário */}
                <form onSubmit={handleSubmit} className={styles.form_area}>

                    {/* Nome + Sobrenome (GRID DE 2 COLUNAS) */}
                    <div className={styles.name_group}>
                        <InputPadrao
                            nome="first_name"
                            labelConteudo="Nome"
                            placeholder="Seu nome"
                            value={formData.first_name}
                            onChange={handleChange}
                        />

                        <InputPadrao
                            nome="last_name"
                            labelConteudo="Sobrenome"
                            placeholder="Seu sobrenome"
                            value={formData.last_name}
                            onChange={handleChange}
                        />
                    </div>

                    {/* E-mail */}
                    <InputPadrao
                        nome="email"
                        tipo="email"
                        labelConteudo="E-mail"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                    />

                    {/* Senha */}
                    <InputPadrao
                        nome="password"
                        tipo="password"
                        labelConteudo="Senha"
                        placeholder="********"
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <p className={styles.password_hint}>Mínimo de 8 caracteres</p>

                    {/* Erro */}
                    {error && <p className={styles.error_message}>{error}</p>}

                    {/* Botão Registrar (PRIMÁRIO - VERDE CIANO) */}
                    <BotaoLogin
                        tipo="submit"
                        nome="registrarConta"
                        texto="Registrar Conta"
                        className={styles.button_register}
                    />

                    {/* Separador e Botões Secundários */}
                    <p className={styles.separator}>Já tem uma conta?</p>

                    {/* Botão Fazer Login (SECUNDÁRIO - CONTORNO CIANO) */}
                    <BotaoLogin
                        tipo="button"
                        nome="fazerLogin"
                        texto="Fazer Login"
                        className={styles.button_login_secondary}
                        onClick={() => navigate('/')}
                    />

                </form>

                {/* Rodapé (Copyright) */}
                <div className={styles.footer}>
                    <p>© 2025 Cadrius AI Systems, Tecnologia de automação inteligente.</p>
                </div>
            </div> {/* Fim do .register_card */}
        </div>
    );
}
export default Register;
