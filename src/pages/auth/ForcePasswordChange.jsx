import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Button from '../../components/ui/Button';
import PasswordField from '../../components/auth/PasswordField';
import PasswordStrength from '../../components/auth/PasswordStrength';
import { FiUser } from 'react-icons/fi';
import Label from '../../components/ui/Label';
import FormGroup from '../../components/ui/FormGroup';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { passwordChecks } from '../../services/passwordPolicy';
import { homePath } from '../../services/home';

import AuthShell, { authStyles as s } from '../../components/auth/AuthShell';

// Troca obrigatória (CAD-221): a TI definiu uma senha temporária; o sistema só libera depois da troca.
export default function ForcePasswordChange() {
    const navigate = useNavigate();
    const { user, refreshUser, logout } = useAuth();
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const checks = passwordChecks(password, { previous: current, email: user?.email });
    const allOk = checks.every((c) => c.ok);
    const matches = confirm.length > 0 && confirm === password;
    const step = !current ? 1 : allOk && matches ? 3 : 2;
    const stepClass = (n) => (step > n ? s.step_done : step === n ? s.step_on : '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!checks.every((c) => c.ok)) return setError('A nova senha ainda não atende a todos os requisitos.');
        if (password !== confirm) return setError('As senhas não conferem.');
        setLoading(true);
        setError(null);
        try {
            await api.post('/auth/change-password/', { current_password: current, new_password: password, confirm_password: confirm });
            const me = await refreshUser();
            toast.success('Senha alterada. Bem-vindo(a) de volta!');
            navigate(homePath(me), { replace: true });
        } catch (err) {
            const data = err.response?.data || {};
            setError([data.current_password, data.new_password, data.confirm_password, data.detail, data.non_field_errors]
                .flat().filter(Boolean).join(' ') || 'Não foi possível trocar a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell eyebrow="Segurança" title="Crie sua nova senha"
            subtitle="A equipe de TI criou uma senha temporária para você. Troque-a agora: leva menos de um minuto e só você saberá a nova."
            footer={<button type="button" className={s.link} onClick={logout}>Sair</button>}>
            <ol className={s.steps} aria-label="Etapas">
                <li className={stepClass(1)}><span className={s.step_num}>{step > 1 ? '✓' : 1}</span> Senha temporária</li>
                <li className={stepClass(2)}><span className={s.step_num}>{step > 2 ? '✓' : 2}</span> Nova senha</li>
                <li className={stepClass(3)}><span className={s.step_num}>3</span> Pronto</li>
            </ol>
            {user?.email && <span className={s.account}><FiUser aria-hidden="true" /> {user.email}</span>}
            <form onSubmit={handleSubmit} noValidate className={s.form}>
                <input type="text" name="username" autoComplete="username" value={user?.email || ''} readOnly hidden />
                <FormGroup>
                    <Label htmlFor="pwd-current">Senha temporária (a que a TI passou)</Label>
                    <PasswordField id="pwd-current" autoComplete="current-password" value={current} autoFocus
                        onChange={(e) => { setCurrent(e.target.value); setError(null); }} />
                </FormGroup>
                <FormGroup>
                    <Label htmlFor="pwd-new">Nova senha</Label>
                    <PasswordField id="pwd-new" autoComplete="new-password" value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }} aria-describedby="pwd-rules" />
                </FormGroup>
                <PasswordStrength checks={checks} />
                <FormGroup>
                    <Label htmlFor="pwd-confirm">Confirmar nova senha</Label>
                    <PasswordField id="pwd-confirm" autoComplete="new-password" value={confirm} aria-describedby="pwd-match"
                        onChange={(e) => { setConfirm(e.target.value); setError(null); }} />
                </FormGroup>
                {confirm && (
                    <p id="pwd-match" className={`${s.match} ${matches ? s.check_ok : s.error}`} aria-live="polite">
                        {matches ? '✓ As senhas conferem' : 'As senhas ainda não conferem'}</p>
                )}
                {error && <p role="alert" className={s.error}>{error}</p>}
                <Button type="submit" disabled={loading || !current || !allOk || !matches}>{loading ? 'Salvando…' : 'Salvar nova senha e entrar'}</Button>
                <p className={s.tip}>Dica: um gerenciador de senhas (do navegador ou do celular) cria e guarda uma senha forte para você.</p>
            </form>
        </AuthShell>
    );
}
