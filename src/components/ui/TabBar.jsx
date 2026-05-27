import styles from './TabBar.module.css';

const TabBar = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className={styles.container}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className={`${styles.count} ${activeTab === tab.id ? styles.count_active : ''}`}>
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default TabBar;