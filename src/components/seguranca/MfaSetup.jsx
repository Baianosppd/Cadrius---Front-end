import { useState } from 'react';
import styles from './seguranca.module.css';
import { Banner, errorMessage } from './ui';
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Banner tone="warn">Guarde estes códigos agora — eles <strong>não serão mostrados de novo</strong>. Cada um vale uma vez, se você perder o celular.</Banner>
            <div className={styles.mono} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, max-content)', gap: '6px 28px', fontSize: '1rem' }}>
                {codes.map((c) => <span key={c}>{c}</span>)}
            </div>
            <div className={styles.btn_row}>
                <button type="button" className={styles.btn} onClick={() => navigator.clipboard?.writeText(text)}>Copiar</button>
                <button type="button" className={styles.btn} onClick={download}>Baixar .txt</button>
                {onDone && <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={onDone}>{doneLabel}</button>}
            </div>
        </div>
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
        <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 620 }}>
            <div className={styles.section_title}>Verificação em duas etapas</div>
            {step === 'start' && (
                <>
                    <p className={styles.muted}>{intro || 'Além da senha, o login vai pedir um código de 6 dígitos do aplicativo autenticador do seu celular (Google Authenticator, Microsoft Authenticator, 1Password…).'}</p>
                    <div><button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={begin} disabled={busy}>Ativar agora</button></div>
                </>
            )}
            {step === 'scan' && setup && (
                <form onSubmit={confirm} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p>1. No aplicativo autenticador, toque em <strong>adicionar conta</strong> e leia o QR code:</p>
                    <img src={svgDataUri(setup.qr_svg)} alt="QR code para o aplicativo autenticador" width={200} height={200}
                        style={{ border: '1px solid var(--c-border)', borderRadius: 8, background: '#fff' }} />
                    <p className={styles.muted}>Sem câmera? Digite a chave: <span className={styles.mono}>{setup.secret.match(/.{1,4}/g).join(' ')}</span></p>
                    <label className={styles.field}>2. Digite o código de 6 dígitos que aparece no aplicativo
                        <input className={styles.input} value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric"
                            autoComplete="one-time-code" maxLength={7} style={{ maxWidth: 160, letterSpacing: '.2em' }} autoFocus />
                    </label>
                    <div><button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || code.replace(/\s/g, '').length < 6}>Confirmar</button></div>
                </form>
            )}
            {step === 'codes' && <RecoveryCodes codes={codes} email={user?.email} onDone={onDone} />}
            {error && <Banner tone="error">{error}</Banner>}
        </div>
    );
}
