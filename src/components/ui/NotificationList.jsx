import styles from './NotificationList.module.css';
import { FiFileText, FiCalendar, FiZap, FiMail } from 'react-icons/fi';

const iconMap = {
    documento: { icon: FiFileText, color: '#3b82f6', bg: '#eff6ff' },
    prazo: { icon: FiCalendar, color: '#f59e0b', bg: '#fffbeb' },
    automacao: { icon: FiZap, color: '#8b5cf6', bg: '#f5f3ff' },
    erro: { icon: FiMail, color: '#ef4444', bg: '#fef2f2' },
};

const NotificationItem = ({ title, description, time, read, type, onClick }) => {
    const { icon: Icon, color, bg } = iconMap[type] || iconMap.documento;

    return (
        <div className={`${styles.item} ${!read ? styles.item_unread : ''}`} onClick={onClick}>
            <div className={styles.item_left}>
                <div className={styles.icon_wrapper} style={{ backgroundColor: bg }}>
                    <Icon className={styles.icon} style={{ color }} />
                </div>
                <div className={styles.item_content}>
                    <p className={styles.item_title}>{title}</p>
                    <p className={styles.item_description}>{description}</p>
                    <span className={styles.item_time}>{time}</span>
                </div>
            </div>
            {!read && <span className={styles.unread_dot} />}
        </div>
    );
};

const NotificationList = ({ notifications = [], onSelect }) => {
    return (
        <div className={styles.container}>
            {notifications.map((notification, index) => (
                <NotificationItem
                    key={index}
                    {...notification}
                    onClick={() => onSelect(notification)}
                />
            ))}
        </div>
    );
};

export default NotificationList;