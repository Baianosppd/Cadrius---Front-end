import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Title from '../../components/ui/Title';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import ContainerCard from '../../components/ui/ContainerCard';
import FormGroup from '../../components/ui/FormGroup';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { passwordChecks } from '../../services/passwordPolicy';

import styles from './Remember.module.css';
import { CourthouseScene } from '../../components/illustrations/LegalArt';

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
            navigate(me?.is_staff && !me?.organization ? '/gestao' : '/dashboard', { replace: true });
        } catch (err) {
            const data = err.response?.data || {};
            setError([data.current_password, data.new_password, data.confirm_password, data.detail, data.non_field_errors]
                .flat().filter(Boolean).join(' ') || 'Não foi possível trocar a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.main_wrapper}>
            <div className={styles.side_image}>
                <CourthouseScene style={{ width: '100%', maxWidth: 460, height: 'auto' }} />
            </div>
            <div className={styles.side_form}>
                <ContainerCard>
                    <Title as="h1">Crie sua nova senha</Title>
                    <p style={{ color: 'var(--c-muted)', fontSize: 'var(--fs-base)', lineHeight: 1.5 }}>
                        A equipe de TI redefiniu sua senha. Por segurança, troque a senha temporária antes de continuar.
                    </p>
                    <form onSubmit={handleSubmit} noValidate className={styles.send}>
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
                        <ul id="pwd-rules" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4, fontSize: 'var(--fs-sm)' }}>
                            {checks.map((c) => (
                                <li key={c.label} style={{ color: c.ok ? 'var(--c-success)' : 'var(--c-muted)' }}>
                                    {c.ok ? '✓' : '○'} {c.label}
                                </li>
                            ))}
                        </ul>
                        <FormGroup>
                            <Label htmlFor="pwd-confirm">Confirmar nova senha</Label>
                            <Input id="pwd-confirm" type="password" autoComplete="new-password" value={confirm}
                                onChange={(e) => { setConfirm(e.target.value); setError(null); }} />
                        </FormGroup>
                        {error && <p role="alert" style={{ color: 'var(--c-danger)', fontSize: 'var(--fs-base)' }}>{error}</p>}
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Salvar nova senha'}</Button>
                    </form>
                    <button type="button" onClick={logout} style={{ background: 'none', border: 0, color: 'var(--c-primary)', cursor: 'pointer' }}>
                        Sair
                    </button>
                </ContainerCard>
            </div>
        </div>
    );
}
