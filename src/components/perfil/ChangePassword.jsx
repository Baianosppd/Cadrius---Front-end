import { useState } from 'react';
import { toast } from 'react-toastify';
import ui from '../ui/ui.module.css';
import { Banner, Button, Field, Stack } from '../ui';
import PasswordField from '../auth/PasswordField';
import PasswordStrength from '../auth/PasswordStrength';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { passwordChecks } from '../../services/passwordPolicy';

// Trocar a senha no Perfil: mesmas regras e mesmo endpoint da troca obrigatória (ForcePasswordChange)
const ChangePassword = () => {
    const { user } = useAuth();
    const [atual, setAtual] = useState('');
    const [nova, setNova] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const checks = passwordChecks(nova, { previous: atual, email: user?.email });
    const allOk = checks.every((c) => c.ok);
    const matches = confirmar.length > 0 && confirmar === nova;

    const submit = async (e) => {
        e.preventDefault();
        if (!allOk) { setError('A nova senha ainda não atende a todos os requisitos.'); return; }
        if (!matches) { setError('As senhas não conferem.'); return; }
        setBusy(true);
        setError('');
        try {
            await api.post('/auth/change-password/', { current_password: atual, new_password: nova, confirm_password: confirmar });
            toast.success('Senha alterada.');
            setAtual(''); setNova(''); setConfirmar('');
        } catch (err) {
            const data = err.response?.data || {};
            setError([data.current_password, data.new_password, data.confirm_password, data.detail, data.non_field_errors]
                .flat().filter(Boolean).join(' ') || 'Não foi possível trocar a senha.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Stack as="form" gap={3} className={`${ui.card} ${ui.narrow}`} onSubmit={submit} noValidate>
            <h2 className={`${ui.section_title} ${ui.mb_0}`}>Alterar senha</h2>
            <Field label="Senha atual">
                <PasswordField id="perfil-senha-atual" size="md" autoComplete="current-password" value={atual} onChange={(e) => { setAtual(e.target.value); setError(''); }} />
            </Field>
            <Field label="Nova senha">
                <PasswordField id="perfil-senha-nova" size="md" autoComplete="new-password" value={nova} aria-describedby="perfil-pwd-rules"
                    onChange={(e) => { setNova(e.target.value); setError(''); }} />
            </Field>
            {nova && <PasswordStrength checks={checks} id="perfil-pwd-rules" />}
            <Field label="Confirmar nova senha"
                error={confirmar && !matches ? 'As senhas ainda não conferem.' : undefined}>
                <PasswordField id="perfil-senha-confirmar" size="md" autoComplete="new-password" value={confirmar}
                    onChange={(e) => { setConfirmar(e.target.value); setError(''); }} />
            </Field>
            {error && <Banner tone="error">{error}</Banner>}
            <Button type="submit" variant="primary" className={ui.w_fit} disabled={!atual || !allOk || !matches} loading={busy} loadingLabel="Salvando…">
                Atualizar senha
            </Button>
        </Stack>
    );
};

export default ChangePassword;
