import styles from './TeamMembers.module.css';
import { FiMoreVertical, FiUserPlus } from 'react-icons/fi';

const Avatar = ({ initials }) => (
    <div className={styles.avatar}>
        <span className={styles.avatar_text}>{initials}</span>
    </div>
);

const CreditBar = ({ used, total }) => {
    const percentage = Math.round((used / total) * 100);
    return (
        <div className={styles.credit_wrapper}>
            <div className={styles.credit_info}>
                <span>{used} / {total}</span>
                <span>{percentage}%</span>
            </div>
            <div className={styles.credit_bar}>
                <div
                    className={styles.credit_fill}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const MemberRow = ({ initials, name, isAdmin, email, permission, creditsUsed, creditsTotal }) => (
    <tr className={styles.row}>
        <td className={styles.cell_name}>
            <Avatar initials={initials} />
            <span className={styles.name}>{name}</span>
            {isAdmin && <span className={styles.admin_badge}>Admin</span>}
        </td>
        <td className={styles.cell}>{email}</td>
        <td className={styles.cell}>
            <span className={styles.permission_badge}>{permission}</span>
        </td>
        <td className={styles.cell}>
            <CreditBar used={creditsUsed} total={creditsTotal} />
        </td>
        <td className={styles.cell}>
            <span className={styles.status_badge}>Ativo</span>
        </td>
        <td className={styles.cell}>
            <button className={styles.action_button}>
                <FiMoreVertical />
            </button>
        </td>
    </tr>
);

const TeamMembers = ({ members = [], onInvite }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Membros da Equipe</h2>
                    <p className={styles.subtitle}>Gerencie os funcionários e seus acessos</p>
                </div>
                <button className={styles.invite_button} onClick={onInvite}>
                    <FiUserPlus className={styles.invite_icon} />
                    Convidar Funcionário
                </button>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr className={styles.header_row}>
                        <th className={styles.header_cell}>Nome</th>
                        <th className={styles.header_cell}>E-mail</th>
                        <th className={styles.header_cell}>Grupo de Permissão</th>
                        <th className={styles.header_cell}>Créditos</th>
                        <th className={styles.header_cell}>Status</th>
                        <th className={styles.header_cell}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((member, index) => (
                        <MemberRow key={index} {...member} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeamMembers;