import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiDatabase, FiRepeat, FiX } from 'react-icons/fi';
import { ENVIRONMENTS, currentEnv, envHost, switchUrl } from '../../services/environment';
import styles from './EnvSwitch.module.css';

// Seleção da base no login (CAD-219), no estilo SAP Logon / Protheus: o rodapé do formulário mostra a base em uso;
// clicando, abre a lista de bases para escolher e conectar. São publicações separadas (contas e dados próprios):
// levamos só o e-mail digitado, nunca a senha.
const ORDER = ['producao', 'teste'];

function EnvModal({ env, email, onClose }) {
    const [choice, setChoice] = useState(env === 'local' ? 'teste' : env);
    const dialog = useRef(null);
    useEffect(() => {
        const prev = document.activeElement;
        dialog.current?.querySelector('input[type=radio]:checked')?.focus();
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
    }, [onClose]);
    const connect = (e) => {
        e.preventDefault();
        if (choice === env) { onClose(); return; }
        const url = switchUrl(choice, email.trim());
        if (url) window.location.assign(url);
    };
    return (
        <div className={styles.overlay} onClick={onClose}>
            <form ref={dialog} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="env-title"
                onClick={(e) => e.stopPropagation()} onSubmit={connect}>
                <div className={styles.modal_head}>
                    <div>
                        <h2 id="env-title" className={styles.modal_title}>Selecionar base</h2>
                        <p className={styles.modal_sub}>Escolha em qual ambiente do Cadrius você quer entrar.</p>
                    </div>
                    <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar"><FiX /></button>
                </div>
                <fieldset className={styles.list}>
                    <legend className="sr-only">Bases disponíveis</legend>
                    {ORDER.map((key) => {
                        const e = ENVIRONMENTS[key];
                        return (
                            <label key={key} className={`${styles.option} ${choice === key ? styles.option_on : ''}`}>
                                <input type="radio" name="base" value={key} checked={choice === key} onChange={() => setChoice(key)} aria-label={e.label} />
                                <span className={`${styles.dot} ${styles['dot_' + key]}`} aria-hidden="true" />
                                <span className={styles.option_body}>
                                    <span className={styles.option_name}>{e.label}{key === env && <span className={styles.current}>em uso</span>}</span>
                                    <span className={styles.option_desc}>{e.description}</span>
                                    <span className={styles.option_host}>{envHost(key)}</span>
                                </span>
                                {choice === key && <FiCheck className={styles.check} aria-hidden="true" />}
                            </label>
                        );
                    })}
                </fieldset>
                <div className={styles.actions}>
                    <button type="button" className={styles.btn} onClick={onClose}>Cancelar</button>
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`}>{choice === env ? 'Continuar aqui' : 'Conectar'}</button>
                </div>
            </form>
        </div>
    );
}

export default function EnvSwitch({ email = '' }) {
    const env = currentEnv();
    const [open, setOpen] = useState(false);
    const info = ENVIRONMENTS[env] || { label: 'Local (desenvolvimento)' };
    return (
        <>
            <button type="button" className={styles.field} onClick={() => setOpen(true)} aria-haspopup="dialog"
                aria-label={`Base: ${info.label}. Trocar base`}>
                <FiDatabase className={styles.field_icon} aria-hidden="true" />
                <span className={styles.field_text}>
                    <span className={styles.field_label}>Base</span>
                    <span className={styles.field_value}>
                        <span className={`${styles.dot} ${styles['dot_' + env]}`} aria-hidden="true" />{info.label}
                        <span className={styles.field_host}>{envHost(env)}</span>
                    </span>
                </span>
                <span className={styles.field_action}><FiRepeat aria-hidden="true" /> Trocar</span>
            </button>
            {env === 'teste' && <p className={styles.note}>Você está na base de TESTE: dados fictícios e contas separadas da produção.</p>}
            {open && <EnvModal env={env} email={email} onClose={() => setOpen(false)} />}
        </>
    );
}
