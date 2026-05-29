import styles from './AutomationList.module.css';
import { FiSettings, FiFileText } from 'react-icons/fi';
import { useState } from 'react';

const successColor = (rate) => {
    if (rate >= 95) return '#16a34a';
    if (rate >= 85) return '#f59e0b';
    return '#ef4444';
};

const AutomationRow = ({ name, trigger, active, successRate, lastExecution, onToggle, onSettings, onLogs }) => (
    <tr className={styles.row}>
        <td className={styles.cell_name}>
            <p className={styles.name}>{name}</p>
            <span className={styles.trigger}>Gatilho: {trigger}</span>
        </td>
        <td className={styles.cell}>
            <button
                className={`${styles.toggle} ${active ? styles.toggle_active : styles.toggle_inactive}`}
                onClick={onToggle}
            >
                <span className={`${styles.toggle_thumb} ${active ? styles.thumb_active : styles.thumb_inactive}`} />
            </button>
        </td>
        <td className={styles.cell}>
            <div className={styles.success_wrapper}>
                <div className={styles.success_bar}>
                    <div
                        className={styles.success_fill}
                        style={{
                            width: `${successRate}%`,
                            backgroundColor: successColor(successRate)
                        }}
                    />
                </div>
                <span className={styles.success_rate}>{successRate}%</span>
            </div>
        </td>
        <td className={styles.cell}>{lastExecution}</td>
        <td className={styles.cell_actions}>
            <button className={styles.action_button} onClick={onSettings}>
                <FiSettings className={styles.action_icon} />
            </button>
            <button className={styles.action_button} onClick={onLogs}>
                <FiFileText className={styles.action_icon} />
            </button>
        </td>
    </tr>
);

const AutomationList = ({ automations = [], search = '' }) => {
    const [items, setItems] = useState(automations);

    const handleToggle = (index) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, active: !item.active } : item
        ));
    };

    const filtered = items.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr className={styles.header_row}>
                        <th className={styles.header_cell}>Nome do Fluxo</th>
                        <th className={styles.header_cell}>Status</th>
                        <th className={styles.header_cell}>Taxa de Sucesso</th>
                        <th className={styles.header_cell}>Última Execução</th>
                        <th className={styles.header_cell}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((automation, index) => (
                        <AutomationRow
                            key={index}
                            {...automation}
                            onToggle={() => handleToggle(index)}
                            onSettings={() => {}}
                            onLogs={() => {}}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AutomationList;