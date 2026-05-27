import { useState } from 'react';
import styles from './ChangePassword.module.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const PasswordField = ({ label, value, onChange, show, onToggle }) => (
    <div className={styles.field}>
        <label className={styles.label}>{label}</label>
        <div className={styles.input_wrapper}>
            <input
                className={styles.input}
                type={show ? 'text' : 'password'}
                value={value}
                onChange={onChange}
            />
            <button className={styles.toggle_button} onClick={onToggle} type="button">
                {show ? <FiEyeOff className={styles.eye_icon} /> : <FiEye className={styles.eye_icon} />}
            </button>
        </div>
    </div>
);

const ChangePassword = ({ onSave }) => {
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const [showAtual, setShowAtual] = useState(false);
    const [showNova, setShowNova] = useState(false);
    const [showConfirmar, setShowConfirmar] = useState(false);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Alterar Senha</h2>

            <PasswordField
                label="Senha Atual"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                show={showAtual}
                onToggle={() => setShowAtual(p => !p)}
            />
            <PasswordField
                label="Nova Senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                show={showNova}
                onToggle={() => setShowNova(p => !p)}
            />
            <PasswordField
                label="Confirmar Nova Senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                show={showConfirmar}
                onToggle={() => setShowConfirmar(p => !p)}
            />

            <button
                className={styles.save_button}
                onClick={() => onSave({ senhaAtual, novaSenha, confirmarSenha })}
            >
                Atualizar Senha
            </button>
        </div>
    );
};

export default ChangePassword;