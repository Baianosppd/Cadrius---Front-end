import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <--- 1. Importação do Link adicionada
import { FaCog } from "react-icons/fa";

import useAuth from '../../hooks/useAuth';
import InputPadrao from '../../components/ui/InputPadrao';
import BotaoLogin from '../../components/ui/BotaoLogin';

import Title from '../../components/ui/Title';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import ContainerCard from '../../components/ui/ContainerCard';
import Checkbox from '../../components/ui/CheckBox';
import FormGroup from '../../components/ui/FormGroup';


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
        <div className={styles.main_wrapper}>

            {/* Coluna da Imagem */}
            <div className={styles.side_image}>
                <img src="/imagem.png" alt="Cadrius" />
            </div>

            {/* Coluna do Formulário */}
            <div className={styles.side_form}>
                <ContainerCard>
                    <Title as="h1">Cadrius</Title>
                    <Title as="h2">Entre na sua conta</Title>

                    <form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label>Nome</Label>
                            <Input
                                placeholder="User ID"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Senha</Label>
                            <Input
                                type="password"
                                placeholder="*******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </FormGroup>

                        <div className={styles.row_options}>
                            <Checkbox
                                label="Lembre-me"
                                id="lembrar"
                                checked={lembrar}
                                onChange={(e) => setLembrar(e.target.checked)}
                            />
                            <Link to="/esqueceu-a-senha">Esqueceu a Senha?</Link>
                        </div>

                        <Button type="submit">Entrar</Button>
                    </form>
                </ContainerCard>
            </div>
        </div>
    );
}

export default Login;