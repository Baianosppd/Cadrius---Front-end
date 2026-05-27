import styles from './PermissionsGroups.module.css';
import { FiPlus, FiEdit2, FiCheck } from 'react-icons/fi';

const PermissionCard = ({ name, description, permissions, onEdit }) => (
    <div className={styles.card}>
        <div className={styles.card_header}>
            <div>
                <h3 className={styles.card_title}>{name}</h3>
                <p className={styles.card_description}>{description}</p>
            </div>
            <button className={styles.edit_button} onClick={onEdit}>
                <FiEdit2 className={styles.edit_icon} />
                Editar
            </button>
        </div>
        <div className={styles.permissions_list}>
            {permissions.map((permission, index) => (
                <span key={index} className={styles.permission_tag}>
                    <FiCheck className={styles.check_icon} />
                    {permission}
                </span>
            ))}
        </div>
    </div>
);

const PermissionGroups = ({ groups = [], onCreateGroup }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Grupos de Permissão</h2>
                    <p className={styles.subtitle}>Gerencie os níveis de acesso</p>
                </div>
                <button className={styles.create_button} onClick={onCreateGroup}>
                    <FiPlus className={styles.create_icon} />
                    Criar Grupo
                </button>
            </div>

            <div className={styles.groups_list}>
                {groups.map((group, index) => (
                    <PermissionCard key={index} {...group} onEdit={() => {}} />
                ))}
            </div>
        </div>
    );
};

export default PermissionGroups;