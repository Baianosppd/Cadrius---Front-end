import { useState } from 'react';
import styles from '../ui/ui.module.css';
import s from './Mfa.module.css';
import { Banner, Button, Field, Input, Row, Stack } from '../ui';
import { errorMessage } from '../../utils/format';
import useAuth from '../../hooks/useAuth';
import { mfaApi, recoveryCodesText, svgDataUri } from '../../services/mfa';

export function RecoveryCodes({ codes, email, onDone, doneLabel = 'Já guardei os códigos' }) {
    const text = recoveryCodesText(codes, email);
    const download = () => {
        const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
        const a = Object.assign(document.createElement('a'), { href: url, download: 'cadrius-codigos-de-recuperacao.txt' });
        a.click();
        URL.revokeObjectURL(url);
    };
    return (
        <Stack gap={3}>
            <Banner tone="warn">Guarde estes códigos agora — eles <strong>não serão mostrados de novo</strong>. Cada um vale uma vez, se você perder o celular.</Banner>
            <div className={`${styles.mono} ${s.codes}`}>
                {codes.map((c) => <span key={c}>{c}</span>)}
            </div>
            <Row>
                <Button onClick={() => navigator.clipboard?.writeText(text)}>Copiar</Button>
                <Button onClick={download}>Baixar .txt</Button>
                {onDone && <Button variant="primary" onClick={onDone}>{doneLabel}</Button>}
            </Row>
        </Stack>
    );
}

// Cadastro do autenticador: QR → 1º código → códigos de recuperação. Ao concluir, a sessão passa a ser "com MFA".
export default function MfaSetup({ onDone, onStart, intro }) {
    const { user, loginWithTokens } = useAuth();
    const [step, setStep] = useState('start');   // start → scan → codes
    const [setup, setSetup] = useState(null);
    const [code, setCode] = useState('');
    const [codes, setCodes] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const run = async (fn) => {
        setBusy(true);
        setError('');
        try { await fn(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
    };
    const begin = () => run(async () => { onStart?.(); setSetup(await mfaApi.setup()); setStep('scan'); });
    const confirm = (e) => {
        e.preventDefault();
        run(async () => {
            const data = await mfaApi.confirm(code);
            await loginWithTokens(data.access, data.refresh);   // tokens novos já marcados com MFA
            setCodes(data.recovery_codes);
            setStep('codes');
        });
    };

    return (
        <Stack gap={4} className={`${styles.card} ${s.wide}`}>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Verificação em duas etapas</div>
            {step === 'start' && (
                <>
                    <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>{intro || 'Além da senha, o login vai pedir um código de 6 dígitos do aplicativo autenticador do seu celular (Google Authenticator, Microsoft Authenticator, 1Password…).'}</p>
                    <Button variant="primary" className={styles.w_fit} loading={busy} onClick={begin}>Ativar agora</Button>
                </>
            )}
            {step === 'scan' && setup && (
                <Stack as="form" gap={3} onSubmit={confirm}>
                    <p className={`${styles.mt_0} ${styles.mb_0}`}>1. No aplicativo autenticador, toque em <strong>adicionar conta</strong> e leia o QR code:</p>
                    <img src={svgDataUri(setup.qr_svg)} alt="QR code para o aplicativo autenticador" width={200} height={200} className={s.qr} />
                    <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Sem câmera? Digite a chave: <span className={styles.mono}>{setup.secret.match(/.{1,4}/g).join(' ')}</span></p>
                    <Field label="2. Digite o código de 6 dígitos que aparece no aplicativo">
                        <Input className={s.code_input} value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric"
                            autoComplete="one-time-code" maxLength={7} autoFocus />
                    </Field>
                    <Button type="submit" variant="primary" className={styles.w_fit} disabled={code.replace(/\s/g, '').length < 6} loading={busy}>Confirmar</Button>
                </Stack>
            )}
            {step === 'codes' && <RecoveryCodes codes={codes} email={user?.email} onDone={onDone} />}
            {error && <Banner tone="error">{error}</Banner>}
        </Stack>
    );
}
