import styles from './AutomationToolbar.module.css';
import { FiSearch } from 'react-icons/fi';

const AutomationToolbar = ({ search, onSearchChange, onCreateClick }) => {
    return (
        <div className={styles.container}>
            <div className={styles.search_wrapper}>
                <FiSearch className={styles.search_icon} />
                <input
                    className={styles.search_input}
                    placeholder="Procurar automações..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <button className={styles.create_button} onClick={onCreateClick}>
                Criar Nova Automação
            </button>
        </div>
    );
};

export default AutomationToolbar;