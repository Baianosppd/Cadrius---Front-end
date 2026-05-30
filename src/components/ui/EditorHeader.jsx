import styles from './EditorHeader.module.css';
import { FiPlus, FiPlay, FiSave, FiUpload, FiLayout } from 'react-icons/fi';

const EditorHeader = ({
    title,
    active,
    lastExecution,
    nodeCount,
    onAdd,
    onExecute,
    onSave,
    onImport,
    onAutoLayout,
}) => {
    return (
        <div className={styles.header}>
            <div className={styles.left}>
                <div className={styles.title_wrapper}>
                    <h1 className={styles.title}>{title || 'Novo Fluxo'}</h1>
                    <span className={`${styles.status} ${active ? styles.status_active : styles.status_inactive}`}>
                        <span className={styles.status_dot} />
                        {active ? 'Ativa' : 'Inativa'}
                    </span>
                </div>
                {lastExecution && (
                    <p className={styles.last_execution}>Última execução: {lastExecution}</p>
                )}
            </div>

            <div className={styles.center}>
                <div className={styles.counter}>
                    <span className={styles.counter_dot} style={{ backgroundColor: '#16a34a' }} />
                    <span>Gatilhos: {nodeCount.triggers}</span>
                </div>
                <div className={styles.counter}>
                    <span className={styles.counter_dot} style={{ backgroundColor: '#3b82f6' }} />
                    <span>Ações: {nodeCount.actions}</span>
                </div>
                <div className={styles.counter}>
                    <span className={styles.counter_dot} style={{ backgroundColor: '#f59e0b' }} />
                    <span>Condições: {nodeCount.conditions}</span>
                </div>
                <div className={styles.counter}>
                    <span className={styles.counter_dot} style={{ backgroundColor: '#8b5cf6' }} />
                    <span>Conexões: {nodeCount.connections}</span>
                </div>
            </div>

            <div className={styles.right}>
                <button className={styles.button_secondary} onClick={onAutoLayout}>
                    <FiLayout className={styles.button_icon} />
                    Organizar
                </button>
                <button className={styles.button_secondary} onClick={onImport}>
                    <FiUpload className={styles.button_icon} />
                    Importar
                </button>
                <button className={styles.button_secondary} onClick={onAdd}>
                    <FiPlus className={styles.button_icon} />
                    Adicionar
                </button>
                <button className={styles.button_secondary} onClick={onExecute}>
                    <FiPlay className={styles.button_icon} />
                    Executar
                </button>
                <button className={styles.button_primary} onClick={onSave}>
                    <FiSave className={styles.button_icon} />
                    Salvar
                </button>
            </div>
        </div>
    );
};

export default EditorHeader;