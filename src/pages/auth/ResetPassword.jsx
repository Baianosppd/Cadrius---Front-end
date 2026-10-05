import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Title from '../../components/ui/Title';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import ContainerCard from '../../components/ui/ContainerCard';
import FormGroup from '../../components/ui/FormGroup';
import { confirmPasswordReset, parseResetFragment, passwordResetError } from '../../services/passwordReset';

import styles from './Remember.module.css';
import { CourthouseScene } from '../../components/illustrations/LegalArt';

function ResetPassword() {
    const navigate = useNavigate();
    // Lê uma vez e já remove o token da barra de endereço (histórico/compartilhamento de tela).
    const [link] = useState(() => {
        const parsed = parseResetFragment(window.location.hash);
        if (parsed) window.history.replaceState(null, '', window.location.pathname);
        return parsed;
    });
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.');
        if (password !== confirm) return setError('As senhas não conferem.');
        setLoading(true);
        setError(null);
        try {
            await confirmPasswordReset({ ...link, newPassword: password });
            toast.success('Senha redefinida. Entre com a nova senha.');
            navigate('/', { replace: true });
        } catch (err) {
            setError(passwordResetError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.main_wrapper}>
            <div className={styles.side_image}>
                <CourthouseScene style={{ width: "100%", maxWidth: 460, height: "auto" }} />
            </div>

            <div className={styles.side_form}>
                <ContainerCard>
                    <Title as="h1">Redefinir senha</Title>

                    {!link ? (
                        <div className={styles.send} role="alert">
                            <p>Link inválido ou expirado. Solicite um novo.</p>
                            <Link to="/esqueceu-a-senha">Solicitar novo link</Link>
                        </div>
                    ) : (
                        <div className={styles.send}>
                            <form onSubmit={handleSubmit} noValidate>
                                <FormGroup>
                                    <Label>Nova senha</Label>
                                    <Input type="password" autoComplete="new-password" value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(null); }} />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Confirmar nova senha</Label>
                                    <Input type="password" autoComplete="new-password" value={confirm}
                                        onChange={(e) => { setConfirm(e.target.value); setError(null); }} />
                                </FormGroup>
                                {error && <p role="alert" style={{ color: 'var(--c-danger)', fontSize: '0.875rem' }}>{error}</p>}
                                <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Redefinir senha'}</Button>
                            </form>
                        </div>
                    )}

                    <Link to="/">Voltar ao login</Link>
                </ContainerCard>
            </div>
        </div>
    );
}

export default ResetPassword;
