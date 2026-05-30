import { Handle, Position } from '@xyflow/react';
import { FiX } from 'react-icons/fi';
import styles from './CustomNode.module.css';

const typeConfig = {
    trigger: { label: 'GATILHO', borderColor: '#16a34a', labelColor: '#16a34a', bg: '#f0fdf4' },
    action: { label: 'AÇÃO', borderColor: '#3b82f6', labelColor: '#3b82f6', bg: '#eff6ff' },
    condition: { label: 'CONDIÇÃO', borderColor: '#f59e0b', labelColor: '#f59e0b', bg: '#fffbeb' },
};

const CustomNode = ({ data }) => {
    const Icon = data.icon;
    const config = typeConfig[data.type] || typeConfig.action;

    return (
        <div
            className={styles.node}
            style={{ borderColor: config.borderColor, backgroundColor: config.bg }}
        >
            <Handle type="target" position={Position.Top} className={styles.handle} />

            <div className={styles.header} style={{ borderBottomColor: config.borderColor }}>
                <span className={styles.type_label} style={{ color: config.labelColor }}>
                    {config.label}
                </span>
                <button className={styles.delete_button} onClick={data.onDelete}>
                    <FiX className={styles.delete_icon} />
                </button>
            </div>

            <div className={styles.body}>
                <div className={styles.icon_wrapper} style={{ backgroundColor: data.bg }}>
                    {data.icon && (
                        <data.icon style={{ color: data.color, width: 18, height: 18 }} />
                    )}
                </div>
                <div className={styles.text}>
                    <p className={styles.label}>{data.label}</p>
                    <span className={styles.description}>{data.description}</span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className={styles.handle} />
        </div>
    );
};

export default CustomNode;