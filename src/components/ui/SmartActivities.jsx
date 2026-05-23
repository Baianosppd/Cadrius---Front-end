import styles from './SmartActivities.module.css';

const dotColors = {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
};

const ActivityItem = ({ title, description, time, type }) => (
    <div className={styles.activity_item}>
        <span className={styles.dot} style={{ backgroundColor: dotColors[type] }}></span>
        <div className={styles.activity_content}>
            <p className={styles.activity_title}>{title}</p>
            <p className={styles.activity_description}>{description}</p>
            <span className={styles.activity_time}>{time}</span>
        </div>
    </div>
);

const SmartActivities = ({ activities = [] }) => {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Atividades Inteligentes</h2>
            <div className={styles.activity_list}>
                {activities.map((activity, index) => (
                    <ActivityItem key={index} {...activity} />
                ))}
            </div>
        </div>
    );
};

export default SmartActivities;