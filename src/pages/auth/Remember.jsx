import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import Title from '../../components/ui/Title';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import ContainerCard from '../../components/ui/ContainerCard';
import FormGroup from '../../components/ui/FormGroup';
import { requestPasswordReset, passwordResetError } from '../../services/passwordReset';

import styles from './Remember.module.css';
import { CourthouseScene } from '../../components/illustrations/LegalArt';

function Remember() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return setError('Informe o e-mail da sua conta.');
        setLoading(true);
        setError(null);
        try {
            await requestPasswordReset(email);
            setSent(true); // o back responde igual exista ou não a conta (não revela cadastros)
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
                    <Title as="h1">Esqueceu a senha</Title>

                    {sent ? (
                        <div className={styles.send} role="status">
                            <p>Se o e-mail estiver cadastrado, enviamos as instruções para redefinir a senha.
                                O link vale por 1 hora. Confira também a caixa de spam.</p>
                        </div>
                    ) : (
                        <div className={styles.send}>
                            <form onSubmit={handleSubmit} noValidate>
                                <FormGroup>
                                    <Label>E-mail</Label>
                                    <Input
                                        type="email"
                                        autoComplete="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                    />
                                </FormGroup>
                                {error && <p role="alert" style={{ color: 'var(--c-danger)', fontSize: '0.875rem' }}>{error}</p>}
                                <Button type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar'}</Button>
                            </form>
                        </div>
                    )}

                    <Link to="/" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, textDecoration: "none", alignSelf: "flex-start" }}>← Voltar para o login</Link>
                </ContainerCard>
            </div>
        </div>
    );
}

export default Remember;
