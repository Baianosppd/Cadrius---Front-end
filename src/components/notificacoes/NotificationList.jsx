import styles from './NotificationList.module.css';
import { tipo } from './tipos';

// Cada notificação é um botão: abre com clique, Enter ou Espaço. A cor do ícone vem do tipo (inline).
const NotificationItem = ({ title, description, time, read, type, onClick }) => {
    const { icon: Icon, color, bg } = tipo(type);
    return (
        <button type="button" className={`${styles.item} ${!read ? styles.item_unread : ''}`} onClick={onClick}
            aria-label={`${read ? '' : 'Não lida: '}${title}`}>
            <div className={styles.item_left}>
                <div className={styles.icon_wrapper} style={{ backgroundColor: bg }}>
                    <Icon className={styles.icon} style={{ color }} aria-hidden="true" />
                </div>
                <div className={styles.item_content}>
                    <p className={styles.item_title}>{title}</p>
                    <p className={styles.item_description}>{description}</p>
                    <span className={styles.item_time}>{time}</span>
                </div>
            </div>
            {!read && <span className={styles.unread_dot} aria-hidden="true" />}
        </button>
    );
};

const NotificationList = ({ notifications = [], onSelect }) => (
    <div className={styles.container}>
        {notifications.map((notification, index) => (
            <NotificationItem key={notification.id ?? index} {...notification} onClick={() => onSelect(notification)} />
        ))}
    </div>
);

export default NotificationList;
