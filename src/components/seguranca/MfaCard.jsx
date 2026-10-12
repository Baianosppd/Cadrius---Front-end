import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import s from './Mfa.module.css';
import { Banner, Button, Field, Input, Pill, Row, Stack } from '../ui';
import { errorMessage } from '../../utils/format';
import MfaSetup, { RecoveryCodes } from './MfaSetup';
import useAuth from '../../hooks/useAuth';
import { mfaApi } from '../../services/mfa';

// Cartão do Perfil: estado, ativar, novos códigos de recuperação e desativar (senha + código)
export default function MfaCard() {
    const { user, refreshUser } = useAuth();
    const [status, setStatus] = useState(null);
    const [mode, setMode] = useState('');          // '' | setup | disable | codes
    const [form, setForm] = useState({ password: '', code: '' });
    const [newCodes, setNewCodes] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => mfaApi.status().then(setStatus).catch(() => setStatus(null)), []);
    useEffect(() => { load(); }, [load]);

    const finish = () => { setMode(''); setForm({ password: '', code: '' }); setNewCodes(null); load(); refreshUser(); };
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            if (mode === 'disable') {
                await mfaApi.disable(form.password, form.code);
                toast.success('Verificação em duas etapas desativada.');
                finish();
            } else {
                setNewCodes((await mfaApi.recoveryCodes(form.code)).recovery_codes);
            }
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    if (!status) return null;
    if (mode === 'setup') return <MfaSetup onDone={finish} />;
    return (
        <Stack as="section" gap={3} className={styles.card}>
            <Row gap={2} className={`${styles.section_title} ${styles.mb_0}`}>
                Verificação em duas etapas {status.enabled ? <Pill tone="green">Ativa</Pill> : <Pill tone="gray">Desativada</Pill>}
            </Row>
            {!status.enabled && status.required && <Banner tone="warn">Obrigatória para a sua conta{user?.is_staff ? ' (equipe Cadrius)' : ''}.</Banner>}
            {status.enabled && <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Códigos de recuperação restantes: <strong>{status.recovery_codes_left}</strong></p>}
            {mode === '' && (
                <Row>
                    {!status.enabled && <Button variant="primary" onClick={() => setMode('setup')}>Ativar</Button>}
                    {status.enabled && <Button onClick={() => setMode('codes')}>Gerar novos códigos de recuperação</Button>}
                    {status.enabled && <Button variant="danger" onClick={() => setMode('disable')}>Desativar</Button>}
                </Row>
            )}
            {(mode === 'disable' || mode === 'codes') && !newCodes && (
                <Stack as="form" gap={3} onSubmit={submit} className={s.narrow}>
                    {mode === 'disable' && (
                        <Field label="Senha atual">
                            <Input type="password" value={form.password} autoComplete="current-password"
                                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                        </Field>
                    )}
                    <Field label={mode === 'disable' ? 'Código do aplicativo ou de recuperação' : 'Código do aplicativo'}>
                        <Input value={form.code} inputMode={mode === 'codes' ? 'numeric' : 'text'} autoComplete="one-time-code"
                            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                    </Field>
                    <Row>
                        <Button type="submit" variant={mode === 'disable' ? 'danger' : 'primary'} loading={busy}>Confirmar</Button>
                        <Button onClick={finish} disabled={busy}>Cancelar</Button>
                    </Row>
                </Stack>
            )}
            {newCodes && <RecoveryCodes codes={newCodes} email={user?.email} onDone={finish} doneLabel="Concluir" />}
        </Stack>
    );
}
