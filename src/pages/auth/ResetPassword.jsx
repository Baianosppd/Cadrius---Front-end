import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiAlertTriangle } from 'react-icons/fi';

import Button from '../../components/ui/Button';
import PasswordField from '../../components/auth/PasswordField';
import PasswordStrength from '../../components/auth/PasswordStrength';
import Label from '../../components/ui/Label';
import FormGroup from '../../components/ui/FormGroup';
import AuthShell, { authStyles as s } from '../../components/auth/AuthShell';
import { confirmPasswordReset, parseResetFragment, passwordResetError } from '../../services/passwordReset';
import { passwordChecks } from '../../services/passwordPolicy';

// Criar nova senha pelo link do e-mail (CAD-225: mesmo padrão visual do login, regras da senha à vista)
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
    const checks = passwordChecks(password).filter((c) => !/tempor/i.test(c.label));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!checks.every((c) => c.ok)) return setError('A nova senha ainda não atende a todos os requisitos.');
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

    const footer = <><Link className={s.link} to="/">← Voltar para o login</Link><Link className={s.link} to="/esqueceu-a-senha">Pedir novo link</Link></>;

    if (!link) {
        return (
            <AuthShell eyebrow="Acesso" title="Link expirado ou inválido" footer={<Link className={s.link} to="/">← Voltar para o login</Link>}>
                <div className={`${s.notice} ${s.notice_warn}`} role="alert">
                    <FiAlertTriangle aria-hidden="true" />
                    <span>Este link de redefinição não vale mais. Os links duram 1 hora e só podem ser usados uma vez. Peça um novo.</span>
                </div>
                <Button type="button" onClick={() => navigate('/esqueceu-a-senha')}>Pedir novo link</Button>
            </AuthShell>
        );
    }

    return (
        <AuthShell eyebrow="Acesso" title="Criar nova senha" subtitle="Escolha uma senha que você não usa em outros sites." footer={footer}>
            <form className={s.form} onSubmit={handleSubmit} noValidate>
                <FormGroup>
                    <Label htmlFor="new-password">Nova senha</Label>
                    <PasswordField id="new-password" autoComplete="new-password" value={password} autoFocus aria-describedby="pwd-rules"
                        onChange={(e) => { setPassword(e.target.value); setError(null); }} />
                </FormGroup>
                <PasswordStrength checks={checks} />
                <FormGroup>
                    <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                    <PasswordField id="confirm-password" autoComplete="new-password" value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setError(null); }} />
                </FormGroup>
                {confirm && <p className={`${s.match} ${confirm === password ? s.check_ok : s.error}`} aria-live="polite">
                    {confirm === password ? '✓ As senhas conferem' : 'As senhas ainda não conferem'}</p>}
                {error && <p role="alert" className={s.error}>{error}</p>}
                <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Salvar nova senha'}</Button>
            </form>
        </AuthShell>
    );
}

export default ResetPassword;
