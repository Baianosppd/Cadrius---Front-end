import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
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
            subtitle="A equipe de TI redefiniu sua senha. Por segurança, troque a senha temporária antes de continuar."
            footer={<button type="button" className={s.link} onClick={logout}>Sair</button>}>
            <form onSubmit={handleSubmit} noValidate className={s.form}>
                <input type="text" name="username" autoComplete="username" value={user?.email || ''} readOnly hidden />
                <FormGroup>
                    <Label htmlFor="pwd-current">Senha temporária</Label>
                    <Input id="pwd-current" type="password" autoComplete="current-password" value={current}
                        onChange={(e) => { setCurrent(e.target.value); setError(null); }} />
                </FormGroup>
                <FormGroup>
                    <Label htmlFor="pwd-new">Nova senha</Label>
                    <Input id="pwd-new" type="password" autoComplete="new-password" value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }} aria-describedby="pwd-rules" />
                </FormGroup>
                <ul id="pwd-rules" className={s.checks}>
                    {checks.map((c) => <li key={c.label} className={c.ok ? s.check_ok : s.check_todo}>{c.ok ? '✓' : '○'} {c.label}</li>)}
                </ul>
                <FormGroup>
                    <Label htmlFor="pwd-confirm">Confirmar nova senha</Label>
                    <Input id="pwd-confirm" type="password" autoComplete="new-password" value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setError(null); }} />
                </FormGroup>
                {error && <p role="alert" className={s.error}>{error}</p>}
                <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Salvar nova senha'}</Button>
            </form>
        </AuthShell>
    );
}
