import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import FormGroup from '../../components/ui/FormGroup';
import AuthShell, { authStyles as s } from '../../components/auth/AuthShell';
import { requestPasswordReset, passwordResetError } from '../../services/passwordReset';

// Recuperar acesso (CAD-225: mesmo padrão visual do login)
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
        <AuthShell
            eyebrow="Acesso"
            title="Recuperar senha"
            subtitle={sent ? null : 'Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.'}
            footer={<><Link className={s.link} to="/">← Voltar para o login</Link><span className={s.muted}>O link vale por 1 hora</span></>}
        >
            {sent ? (
                <>
                    <div className={`${s.notice} ${s.notice_ok}`} role="status">
                        <FiCheckCircle aria-hidden="true" />
                        <span>Se <strong>{email.trim()}</strong> estiver cadastrado, enviamos as instruções. Confira também a caixa de spam.</span>
                    </div>
                    <button type="button" className={s.link} onClick={() => setSent(false)}>Usar outro e-mail</button>
                </>
            ) : (
                <form className={s.form} onSubmit={handleSubmit} noValidate>
                    <FormGroup>
                        <Label htmlFor="reset-email">E-mail</Label>
                        <Input id="reset-email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} autoFocus
                            onChange={(e) => { setEmail(e.target.value); setError(null); }} />
                    </FormGroup>
                    {error && <p role="alert" className={s.error}>{error}</p>}
                    <Button type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar link'}</Button>
                </form>
            )}
        </AuthShell>
    );
}

export default Remember;
