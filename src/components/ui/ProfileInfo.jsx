import { useState, useRef } from 'react';
import styles from './ProfileInfo.module.css';
import { FiCamera } from 'react-icons/fi';

const ProfileInfo = ({ user = {}, onSave, onPhotoChange }) => {
    const [nome, setNome] = useState(user.nome || '');
    const [email, setEmail] = useState(user.email || '');
    const [telefone, setTelefone] = useState(user.telefone || '');
    const [oab, setOab] = useState(user.oab || '');
    const [fotoPreview, setFotoPreview] = useState(user.foto || null);
    const fileInputRef = useRef(null);

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const preview = URL.createObjectURL(file);
        setFotoPreview(preview);

        if (onPhotoChange) onPhotoChange(file);
    };

    const initials = user.iniciais || nome
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
                        {fotoPreview ? (
                            <img src={fotoPreview} alt="Perfil" className={styles.avatar_img} />
                        ) : (
                            <span className={styles.avatar_initials}>{initials}</span>
                        )}
                    </div>
                    <button className={styles.avatar_button} onClick={handlePhotoClick}>
                        <FiCamera className={styles.camera_icon} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                    />
                </div>
                <div className={styles.avatar_info}>
                    <p className={styles.avatar_name}>{nome}</p>
                    <p className={styles.avatar_email}>{email}</p>
                    <button className={styles.change_photo} onClick={handlePhotoClick}>
                        Alterar Foto
                    </button>
                </div>
            </div>

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