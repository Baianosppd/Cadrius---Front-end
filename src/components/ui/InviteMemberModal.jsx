import { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './InviteMemberModal.module.css';
import { FiX } from 'react-icons/fi';

const InviteMemberModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'MEMBER',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!formData.email) return;
        setLoading(true);
        await onSave({ email: formData.email, role: formData.role });
        setLoading(false);
    };

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Convidar Funcionário</h3>
                    <button className={styles.close_button} onClick={onClose}>
                        <FiX className={styles.close_icon} />
                    </button>
                </div>

                <div className={styles.body}>
                    <div className={styles.field}>
                        <label className={styles.label}>Nome Completo</label>
                        <input
                            className={styles.input}
                            placeholder="João Silva"
                            value={formData.name}
                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>E-mail</label>
                        <input
                            className={styles.input}
                            placeholder="joao@empresa.com"
                            value={formData.email}
                            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Cargo</label>
                        <select
                            className={styles.select}
                            value={formData.role}
                            onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                        >
                            <option value="OWNER">Dono do Escritório</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="MEMBER">Advogado/Membro</option>
                            <option value="VIEWER">Apenas Leitura</option>
                        </select>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancel_button} onClick={onClose}>
                        Cancelar
                    </button>
                    <button className={styles.save_button} onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Convidando...' : 'Convidar'}
                    </button>
                </div>
            </div>
        </div>,
        window.document.body
    );
};

export default InviteMemberModal;