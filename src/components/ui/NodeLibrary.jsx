import styles from './NodeLibrary.module.css';
import {
    FiMessageSquare, FiMail, FiCalendar, FiZap,
    FiSend, FiFileText, FiPlusSquare, FiSmartphone,
    FiHardDrive, FiSlack, FiGitBranch, FiClock
} from 'react-icons/fi';

const nodeGroups = [
    {
        label: 'GATILHOS',
        color: '#16a34a',
        nodes: [
            { type: 'trigger', subtype: 'whatsapp', label: 'WhatsApp', description: 'Mensagem recebida', icon: FiMessageSquare, color: '#16a34a', bg: '#dcfce7' },
            { type: 'trigger', subtype: 'email', label: 'E-mail', description: 'E-mail recebido', icon: FiMail, color: '#16a34a', bg: '#dcfce7' },
            { type: 'trigger', subtype: 'projuris', label: 'Projuris', description: 'Evento no sistema', icon: FiFileText, color: '#16a34a', bg: '#dcfce7' },
            { type: 'trigger', subtype: 'agendamento', label: 'Agendamento', description: 'Horário programado', icon: FiCalendar, color: '#16a34a', bg: '#dcfce7' },
        ],
    },
    {
        label: 'AÇÕES',
        color: '#3b82f6',
        nodes: [
            { type: 'action', subtype: 'send_whatsapp', label: 'Enviar WhatsApp', description: 'Enviar mensagem', icon: FiSend, color: '#3b82f6', bg: '#dbeafe' },
            { type: 'action', subtype: 'send_email', label: 'Enviar E-mail', description: 'Enviar e-mail', icon: FiMail, color: '#3b82f6', bg: '#dbeafe' },
            { type: 'action', subtype: 'criar_projuris', label: 'Criar no Projuris', description: 'Processo ou tarefa', icon: FiPlusSquare, color: '#3b82f6', bg: '#dbeafe' },
            { type: 'action', subtype: 'send_sms', label: 'Enviar SMS', description: 'Notificação por SMS', icon: FiSmartphone, color: '#3b82f6', bg: '#dbeafe' },
            { type: 'action', subtype: 'google_drive', label: 'Google Drive', description: 'Salvar arquivo', icon: FiHardDrive, color: '#3b82f6', bg: '#dbeafe' },
            { type: 'action', subtype: 'slack', label: 'Slack', description: 'Notificar canal', icon: FiSlack, color: '#3b82f6', bg: '#dbeafe' },
        ],
    },
    {
        label: 'CONDIÇÕES',
        color: '#f59e0b',
        nodes: [
            { type: 'condition', subtype: 'condicao', label: 'Condição', description: 'Ramificar fluxo', icon: FiGitBranch, color: '#f59e0b', bg: '#fef9c3' },
            { type: 'condition', subtype: 'aguardar', label: 'Aguardar', description: 'Delay no fluxo', icon: FiClock, color: '#f59e0b', bg: '#fef9c3' },
        ],
    },
];

const DraggableNode = ({ node }) => {
    const Icon = node.icon;

    const onDragStart = (e) => {
        e.dataTransfer.setData('application/reactflow', JSON.stringify(node));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className={styles.node_item}
            draggable
            onDragStart={onDragStart}
        >
            <div className={styles.node_icon} style={{ backgroundColor: node.bg }}>
                <Icon style={{ color: node.color, width: 16, height: 16 }} />
            </div>
            <div className={styles.node_text}>
                <p className={styles.node_label}>{node.label}</p>
                <span className={styles.node_description}>{node.description}</span>
            </div>
        </div>
    );
};

const NodeLibrary = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <p className={styles.header_title}>Biblioteca de Nós</p>
                <p className={styles.header_subtitle}>Arraste para o canvas ou clique para adicionar</p>
            </div>

            <div className={styles.groups}>
                {nodeGroups.map((group) => (
                    <div key={group.label} className={styles.group}>
                        <p className={styles.group_label} style={{ color: group.color }}>
                            {group.label}
                        </p>
                        <div className={styles.nodes_list}>
                            {group.nodes.map((node) => (
                                <DraggableNode key={node.subtype} node={node} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NodeLibrary;