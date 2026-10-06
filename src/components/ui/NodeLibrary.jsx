import styles from './NodeLibrary.module.css';
import { isSupported } from '../../services/flowMapper';
import { FiMessageSquare, FiMail, FiSend, FiLink } from 'react-icons/fi';

const nodeGroups = [
    {
        label: 'GATILHOS',
        color: '#16a34a',
        nodes: [
            { type: 'trigger', subtype: 'whatsapp', label: 'WhatsApp', description: 'Mensagem recebida', icon: FiMessageSquare, color: '#16a34a', bg: '#dcfce7' },
            { type: 'trigger', subtype: 'email', label: 'E-mail', description: 'E-mail recebido', icon: FiMail, color: '#16a34a', bg: '#dcfce7' },
            { type: 'trigger', subtype: 'webhook_in', label: 'Webhook externo', description: 'Recebe eventos de outros sistemas', icon: FiLink, color: '#16a34a', bg: '#dcfce7' },
        ],
    },
    {
        label: 'AÇÕES',
        color: '#3b82f6',
        nodes: [
            { type: 'action', subtype: 'send_whatsapp', label: 'Enviar WhatsApp', description: 'Enviar mensagem', icon: FiSend, color: '#3b82f6', bg: '#dbeafe' },
            { type: 'action', subtype: 'webhook', label: 'Chamar webhook', description: 'Enviar dados a um sistema externo', icon: FiLink, color: '#3b82f6', bg: '#dbeafe' },
            { type: 'action', subtype: 'send_email', label: 'Enviar E-mail', description: 'Equipe ou cliente que autorizou', icon: FiMail, color: '#3b82f6', bg: '#dbeafe' },
        ],
    },
];

const DraggableNode = ({ node }) => {
    const Icon = node.icon;

    const supported = isSupported(node.subtype);

    const onDragStart = (e) => {
        if (!supported) { e.preventDefault(); return; }
        e.dataTransfer.setData('application/reactflow', JSON.stringify(node));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className={styles.node_item}
            draggable={supported}
            onDragStart={onDragStart}
            style={supported ? undefined : { opacity: 0.55, cursor: 'not-allowed' }}
            title={supported ? 'Arraste para o canvas' : 'Em breve: ainda não disponível no servidor'}
        >
            <div className={styles.node_icon} style={{ backgroundColor: node.bg }}>
                <Icon style={{ color: node.color, width: 16, height: 16 }} />
            </div>
            <div className={styles.node_text}>
                <p className={styles.node_label}>{node.label}</p>
                <span className={styles.node_description}>{supported ? node.description : 'Em breve'}</span>
            </div>
        </div>
    );
};

const NodeLibrary = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <p className={styles.header_title}>Biblioteca de Nós</p>
                <p className={styles.header_subtitle}>Arraste para o canvas</p>
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
                <p className={styles.header_subtitle} style={{ padding: '0 4px' }}>
                    Condições, horários, prazos e outros apps (Slack, Teams, SMS): use Automações → Regras, ou o bloco
                    “Chamar webhook” para sistemas que recebem webhook.
                </p>
            </div>
        </div>
    );
};

export default NodeLibrary;