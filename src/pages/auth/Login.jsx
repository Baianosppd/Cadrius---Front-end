import React, { useState } from 'react';
import { pendingMfa } from '../../services/mfa';
import { homePath } from '../../services/home';
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

import useAuth from '../../hooks/useAuth';
import { Button, Checkbox, Field, Input, Row, Stack } from '../../components/ui';
import PasswordField from '../../components/auth/PasswordField';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import styles from './Login.module.css';
import EnvSwitch from '../../components/layout/EnvSwitch';
import ThemeToggle from '../../components/layout/ThemeToggle';
import { CourthouseScene } from '../../components/illustrations/LegalArt';
import BrandLogo from '../../components/brand/BrandLogo';

function Login() {
    // e-mail trazido pelo seletor de ambiente (?email=), nunca a senha
    const [username, setUsername] = useState(() => new URLSearchParams(window.location.search).get('email') || '');
    const [password, setPassword] = useState('');
    const [lembrar, setLembrar] = useState(true);
    const [error, setError] = useState(null);

    // 2ª etapa: desafio vindo do login por senha ou do login social (CAD-169)
    const [mfaToken, setMfaToken] = useState(() => pendingMfa.take());
    const [mfaCode, setMfaCode] = useState('');

    const { login, verifyMfa } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const { mfaToken: challenge, user: me } = await login(username, password, lembrar);
            if (challenge) {
                setMfaToken(challenge);
                return;
            }
            navigate(homePath(me));
        } catch (err) {
            console.error("Erro no login:", err.response?.data);
            if (!err.response) {
                toast.error("Falha de comunicação com o servidor. Tente novamente em instantes.");
                return;
            }
            setError('Falha no login. Verifique suas credenciais.');
        }
    };

    const handleMfa = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const data = await verifyMfa(mfaToken, mfaCode);
            if (data.recovery_codes_left !== undefined) {
                toast.warn(`Você usou um código de recuperação. Restam ${data.recovery_codes_left}. Gere novos no Perfil.`);
            }
            navigate(homePath(data.user));
        } catch (err) {
            const code = err.response?.data?.code;
            if (code === 'mfa_expired') {
                setMfaToken(null);
                setMfaCode('');
                setError(err.response.data.detail);
                return;
            }
            setError(err.response?.data?.detail || 'Falha de comunicação com o servidor.');
        }
    };

    // Login social só aparece quando o back tem as rotas (VITE_SSO_ENABLED=true) — CAD-105
    const ssoEnabled = import.meta.env.VITE_SSO_ENABLED === 'true';

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
                <h1 className={styles.dark_title}><BrandLogo size={48} tone="light" /></h1>
                <p className={styles.dark_subtitle}>Automação inteligente para escritórios jurídicos modernos</p>
                <ul className={styles.dark_points}>
                    <li>Publicações do DJEN e prazos em dias úteis</li>
                    <li>Documentos lidos pela IA, sempre com revisão do advogado</li>
                    <li>Dados cifrados e trilha de auditoria (LGPD)</li>
                </ul>
                <div className={styles.dark_art} data-theme="dark"><CourthouseScene /></div>
            </div>

            {/* Lado direito com formulário */}
            <div className={styles.side_form}>
                <div className={styles.form_tools}><ThemeToggle /></div>
                <div className={styles.form_container}>
                    <div className={styles.mobile_brand} aria-hidden="true"><BrandLogo size={34} /></div>
                    <h2 className={styles.form_title}>Entrar</h2>
                    <p className={styles.form_subtitle}>Acesse sua conta para continuar</p>

                    {ssoEnabled && !mfaToken && (
                        <>
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
                        </>
                    )}

                    {mfaToken && (
                        <Stack as="form" gap={5} onSubmit={handleMfa}>
                            <p className={styles.form_subtitle}>Verificação em duas etapas: digite o código de 6 dígitos do seu aplicativo autenticador
                                (ou um código de recuperação).</p>
                            <Field label="Código">
                                <Input size="lg" type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="123456"
                                    value={mfaCode} onChange={(e) => { setMfaCode(e.target.value); setError(null); }} />
                            </Field>
                            <Button type="submit" variant="primary" size="lg" block>Verificar</Button>
                            <button type="button" className={`${styles.forgot_link} ${styles.text_btn}`}
                                onClick={() => { setMfaToken(null); setMfaCode(''); setError(null); }}>Voltar</button>
                            {error && <div className={styles.credentials_invalid}>{error}</div>}
                        </Stack>
                    )}

                    {/* Formulário */}
                    {!mfaToken && <Stack as="form" gap={5} onSubmit={handleSubmit}>
                        <Field label="E-mail">
                            <Input size="lg" type="email" id="username" name="username" autoComplete="username" inputMode="email"
                                placeholder="seu@email.com" value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(null); }} />
                        </Field>

                        <Field label="Senha">
                            <PasswordField id="current-password" name="password" autoComplete="current-password" placeholder="••••••••"
                                value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} />
                        </Field>

                        <Row justify="between" gap={3}>
                            <Checkbox checked={lembrar} onChange={(e) => setLembrar(e.target.checked)}>Manter conectado</Checkbox>
                            <Link to="/esqueceu-a-senha" className={styles.forgot_link}>Esqueceu a senha?</Link>
                        </Row>

                        <Button type="submit" variant="primary" size="lg" block>Entrar</Button>

                        {error && (
                            <div className={styles.credentials_invalid}>
                                {error}
                            </div>
                        )}
                    </Stack>}

                    <p className={styles.register_link}>
                        Não tem uma conta? <Link to="/criar-conta">Criar conta</Link>
                    </p>
                    <EnvSwitch email={username} />
                </div>
            </div>
        </div>
    );
}

export default Login;