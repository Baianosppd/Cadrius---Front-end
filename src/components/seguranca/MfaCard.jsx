import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styles from './seguranca.module.css';
import { Banner, Pill, errorMessage } from './ui';
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
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            <div className={styles.section_title}>Verificação em duas etapas {status.enabled ? <Pill tone="green">Ativa</Pill> : <Pill tone="gray">Desativada</Pill>}</div>
            {!status.enabled && status.required && <Banner tone="warn">Obrigatória para a sua conta{user?.is_staff ? ' (equipe Cadrius)' : ''}.</Banner>}
            {status.enabled && <p className={styles.muted}>Códigos de recuperação restantes: <strong>{status.recovery_codes_left}</strong></p>}
            {mode === '' && (
                <div className={styles.btn_row}>
                    {!status.enabled && <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setMode('setup')}>Ativar</button>}
                    {status.enabled && <button type="button" className={styles.btn} onClick={() => setMode('codes')}>Gerar novos códigos de recuperação</button>}
                    {status.enabled && <button type="button" className={`${styles.btn} ${styles.btn_danger}`} onClick={() => setMode('disable')}>Desativar</button>}
                </div>
            )}
            {(mode === 'disable' || mode === 'codes') && !newCodes && (
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
                    {mode === 'disable' && (
                        <label className={styles.field}>Senha atual
                            <input className={styles.input} type="password" value={form.password} autoComplete="current-password"
                                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                        </label>
                    )}
                    <label className={styles.field}>{mode === 'disable' ? 'Código do aplicativo ou de recuperação' : 'Código do aplicativo'}
                        <input className={styles.input} value={form.code} inputMode={mode === 'codes' ? 'numeric' : 'text'} autoComplete="one-time-code"
                            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                    </label>
                    <div className={styles.btn_row}>
                        <button type="submit" className={`${styles.btn} ${mode === 'disable' ? styles.btn_danger : styles.btn_primary}`} disabled={busy}>Confirmar</button>
                        <button type="button" className={styles.btn} onClick={finish} disabled={busy}>Cancelar</button>
                    </div>
                </form>
            )}
            {newCodes && <RecoveryCodes codes={newCodes} email={user?.email} onDone={finish} doneLabel="Concluir" />}
        </section>
    );
}
