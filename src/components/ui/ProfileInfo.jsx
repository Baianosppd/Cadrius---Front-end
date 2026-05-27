import { useState } from 'react';
import styles from './ProfileInfo.module.css';
import { FiCamera } from 'react-icons/fi';

const ProfileInfo = ({ user = {}, onSave }) => {
    const [nome, setNome] = useState(user.nome || '');
    const [email, setEmail] = useState(user.email || '');
    const [telefone, setTelefone] = useState(user.telefone || '');
    const [oab, setOab] = useState(user.oab || '');

    const initials = nome
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Informações Pessoais</h2>

            <div className={styles.avatar_row}>
                <div className={styles.avatar_wrapper}>
                    <div className={styles.avatar}>
                        <span className={styles.avatar_initials}>{initials}</span>
                    </div>
                    <button className={styles.avatar_button}>
                        <FiCamera className={styles.camera_icon} />
                    </button>
                </div>
                <div className={styles.avatar_info}>
                    <p className={styles.avatar_name}>{nome}</p>
                    <p className={styles.avatar_email}>{email}</p>
                    <button className={styles.change_photo}>Alterar Foto</button>
                </div>
            </div>

            <div className={styles.fields_grid}>
                <div className={styles.field}>
                    <label className={styles.label}>Nome Completo</label>
                    <input
                        className={styles.input}
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>E-mail</label>
                    <input
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Telefone</label>
                    <input
                        className={styles.input}
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>OAB (Opcional)</label>
                    <input
                        className={styles.input}
                        value={oab}
                        onChange={(e) => setOab(e.target.value)}
                    />
                </div>
            </div>

            <button className={styles.save_button} onClick={() => onSave({ nome, email, telefone, oab })}>
                Salvar Alterações
            </button>
        </div>
    );
};

export default ProfileInfo;