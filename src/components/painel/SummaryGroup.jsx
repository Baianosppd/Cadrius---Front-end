import styles from './SummaryGroup.module.css';

const StatBox = ({ icon: Icon, iconColor, title, value }) => (
    <div className={styles.stat_box}>
        {Icon && <Icon className={styles.stat_icon} style={{ color: iconColor }} />}
        <h3 className={styles.stat_value}>{value}</h3>
        <span className={styles.stat_title}>{title}</span>
    </div>
);

const SummaryGroup = ({ stats }) => {
    return (
        <section className={styles.container}>
            {stats.map((stat, index) => (
                <StatBox key={index} {...stat} />
            ))}
        </section>
    );
};

export default SummaryGroup;