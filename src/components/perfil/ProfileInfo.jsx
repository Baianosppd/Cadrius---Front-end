import { useState } from 'react';
import styles from './ProfileInfo.module.css';

// CAD-230: a foto foi para a capa do perfil (ProfileCover)
const ProfileInfo = ({ user = {}, onSave }) => {
    const [nome, setNome] = useState(user.nome || '');
    const [email, setEmail] = useState(user.email || '');
    const [telefone, setTelefone] = useState(user.telefone || '');
    const [oab, setOab] = useState(user.oab || '');

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Informações Pessoais</h2>

            <div className={styles.fields_grid}>
                <div className={styles.field}>
                    <label className={styles.label}>Nome Completo</label>
                    <input className={styles.input} value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>E-mail</label>
                    <input className={styles.input} value={email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Telefone</label>
                    <input className={styles.input} value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>OAB (Opcional)</label>
                    <input className={styles.input} value={oab} onChange={(e) => setOab(e.target.value)} />
                </div>
            </div>

            <button className={styles.save_button} onClick={() => onSave({ nome, email, telefone, oab })}>
                Salvar Alterações
            </button>
        </div>
    );
};

export default ProfileInfo;