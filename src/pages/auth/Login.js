import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <--- 1. Importação do Link adicionada
import { FaCog } from "react-icons/fa";

import useAuth from '../../hooks/useAuth';
import InputPadrao from '../../components/ui/InputPadrao';
import BotaoLogin from '../../components/ui/BotaoLogin';

import styles from './Login.module.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [lembrar, setLembrar] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            console.error("Erro no login:", err);
            setError('Falha no login. Verifique suas credenciais.');
        }
    };

    return (
        <div className={styles.login_container}>
            <div className={styles.login_card}>
                <div className={styles.header_section}>
                    <FaCog className={styles.logo_icon} />
                    <h2 className={styles.title}>CADRIUS AI</h2>
                    <p className={styles.subtitle}>Portal de automação inteligente</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form_area}>
                    <div className={styles.input_group}>
                        <InputPadrao
                            nome="username"
                            labelConteudo="Username"
                            placeholder="Username"
                            tipo="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className={styles.input_group}>
                        <InputPadrao
                            nome="senha"
                            labelConteudo="Senha"
                            placeholder="*******"
                            tipo="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className={styles.options_group}>
                        <InputPadrao
                            nome="lembrar"
                            tipo="checkbox"
                            labelConteudo="Lembrar de mim"
                            value={lembrar}
                            onChange={(e) => setLembrar(e.target.checked)}
                        />
                        {/* 2. Link corrigido aqui */}
                        <Link to="/recuperar-senha" className={styles.forgot_password_link}>
                            Esqueceu a senha?
                        </Link>
                    </div>

                    <BotaoLogin
                        tipo="submit"
                        texto="Acessar Portal"
                        className={styles.button_primary}
                    />

                    <p className={styles.separator}>Novo no Cadrius?</p>

                    <BotaoLogin
                        tipo="button"
                        texto="Criar nova conta"
                        className={styles.button_secondary}
                        onClick={() => navigate('/cadastro')}
                    />

                    {error && <p className={styles.error_message}>{error}</p>}
                </form>

                <div className={styles.footer}>
                    <p>© 2025 Cadrius AI Systems, Tecnologia de automação inteligente.</p>
                </div>
            </div>
        </div>
    );
}

export default Login;