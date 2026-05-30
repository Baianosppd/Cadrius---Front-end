import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

import useAuth from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/CheckBox';
import FormGroup from '../../components/ui/FormGroup';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import styles from './Login.module.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [lembrar, setLembrar] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            console.error("Erro no login:", err.response?.data);
            if (!err.response) {
                toast.error("Falha de comunicação com o servidor. Tente novamente em instantes.");
                return;
            }
            setError('Falha no login. Verifique suas credenciais.');
        }
    };

    const handleGoogle = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}auth/google/`;
    };

    const handleMicrosoft = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}auth/microsoft/`;
    };

    return (
        <div className={styles.main_wrapper}>
            {/* Lado esquerdo escuro */}
            <div className={styles.side_dark}>
                <h1 className={styles.dark_title}>Cadrius</h1>
                <p className={styles.dark_subtitle}>Automação inteligente para escritórios jurídicos modernos</p>
            </div>

            {/* Lado direito com formulário */}
            <div className={styles.side_form}>
                <div className={styles.form_container}>
                    <h2 className={styles.form_title}>Entrar</h2>
                    <p className={styles.form_subtitle}>Acesse sua conta para continuar</p>

                    {/* Botões sociais */}
                    <button className={styles.social_button} onClick={handleGoogle}>
                        <FcGoogle className={styles.social_icon} />
                        Continuar com Google
                    </button>
                    <button className={styles.social_button} onClick={handleMicrosoft}>
                        <img src="/microsoft-icon.png" alt="Microsoft" className={styles.social_icon} />
                        Continuar com Microsoft
                    </button>

                    {/* Separador */}
                    <div className={styles.divider}>
                        <span className={styles.divider_line} />
                        <span className={styles.divider_text}>ou</span>
                        <span className={styles.divider_line} />
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label>E-mail</Label>
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Senha</Label>
                            <div className={styles.password_wrapper}>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                                    className={styles.password_input}
                                />
                                <button
                                    type="button"
                                    className={styles.eye_button}
                                    onClick={() => setShowPassword(p => !p)}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </FormGroup>

                        <div className={styles.row_options}>
                            <Checkbox
                                label="Manter conectado"
                                id="lembrar"
                                checked={lembrar}
                                onChange={(e) => setLembrar(e.target.checked)}
                            />
                            <Link to="/esqueceu-a-senha" className={styles.forgot_link}>
                                Esqueceu a senha?
                            </Link>
                        </div>

                        <Button type="submit">Entrar</Button>

                        {error && (
                            <div className={styles.credentials_invalid}>
                                {error}
                            </div>
                        )}
                    </form>

                    <p className={styles.register_link}>
                        Não tem uma conta? <Link to="/criar-conta">Criar conta</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;