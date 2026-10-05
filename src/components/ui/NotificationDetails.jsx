import styles from './NotificationDetail.module.css';
import { FiFileText, FiCalendar, FiZap, FiMail, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const iconMap = {
    documento: { icon: FiFileText, color: '#3b82f6', bg: 'var(--c-primary-50)' },
    prazo: { icon: FiCalendar, color: '#f59e0b', bg: 'var(--c-warning-bg)' },
    automacao: { icon: FiZap, color: '#8b5cf6', bg: 'rgba(139, 92, 246, .14)' },
    erro: { icon: FiMail, color: '#ef4444', bg: 'var(--c-danger-bg)' },
};

const DetailField = ({ label, value }) => (
    <div className={styles.field}>
        <span className={styles.field_label}>{label}</span>
        <p className={styles.field_value}>{value}</p>
    </div>
);

const NotificationDetail = ({ notification, onBack }) => {
    const navigate = useNavigate();
    const { icon: Icon, color, bg } = iconMap[notification.type] || iconMap.documento;

    return (
        <div className={styles.container}>
            <button className={styles.back_button} onClick={onBack}>
                <FiArrowLeft className={styles.back_icon} />
                Voltar para Notificações
            </button>

            <div className={styles.header}>
                <div className={styles.icon_wrapper} style={{ backgroundColor: bg }}>
                    <Icon className={styles.icon} style={{ color }} />
                </div>
                <div>
                    <h2 className={styles.title}>{notification.title}</h2>
                    <p className={styles.description}>{notification.description}</p>
                    <span className={styles.time}>{notification.time}</span>
                </div>
            </div>

            <div className={styles.fields_grid}>
                <DetailField label="Origem" value={notification.origem || '—'} />
                <DetailField label="Documento" value={notification.documento || '—'} />
            </div>

            <DetailField label="Ação" value={notification.acao || '—'} />
            <DetailField label="Detalhes" value={notification.detalhes || '—'} />

            <div className={styles.footer}>
                <button className={styles.primary_button} onClick={() => navigate(notification.link || '/dashboard')}>
                    {notification.actionLabel || 'Ir para o módulo'}
                </button>
                <button className={styles.secondary_button} onClick={onBack}>
                    Fechar
                </button>
            </div>
        </div>
    );
};

export default NotificationDetail;