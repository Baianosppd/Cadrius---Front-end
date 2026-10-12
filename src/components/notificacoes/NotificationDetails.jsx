import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import styles from './NotificationDetail.module.css';
import ui from '../ui/ui.module.css';
import { Button, Row } from '../ui';
import { tipo } from './tipos';

const DetailField = ({ label, value }) => (
    <div className={styles.field}>
        <span className={styles.field_label}>{label}</span>
        <p className={styles.field_value}>{value}</p>
    </div>
);

const NotificationDetail = ({ notification, onBack }) => {
    const { icon: Icon, color, bg } = tipo(notification.type);
    return (
        <div className={styles.container}>
            <Button variant="ghost" size="sm" icon={FiArrowLeft} className={ui.w_fit} onClick={onBack}>Voltar para Notificações</Button>

            <div className={styles.header}>
                {/* A cor do ícone vem do tipo da notificação */}
                <div className={styles.icon_wrapper} style={{ backgroundColor: bg }}>
                    <Icon className={styles.icon} style={{ color }} aria-hidden="true" />
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

            <Row>
                <Button as={Link} variant="primary" to={notification.link || '/dashboard'}>{notification.actionLabel || 'Ir para o módulo'}</Button>
                <Button onClick={onBack}>Fechar</Button>
            </Row>
        </div>
    );
};

export default NotificationDetail;
