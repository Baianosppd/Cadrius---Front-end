import { FiX } from 'react-icons/fi';
import styles from '../seguranca/seguranca.module.css';

// Painel de propriedades do nó selecionado (config vai em node.data.config e vira o payload do back)
export default function NodeInspector({ node, connections, connectionId, onConnection, onChange, onClose }) {
    if (!node) return null;
    const { subtype } = node.data;
    const cfg = node.data.config || {};
    const set = (patch) => onChange(node.id, { config: { ...cfg, ...patch } });

    return (
        <aside style={{ width: 300, borderLeft: '1px solid var(--c-border)', background: 'var(--c-surface)', padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{node.data.label}</strong>
                <button onClick={onClose} aria-label="Fechar painel" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><FiX /></button>
            </div>

            {node.data.type === 'trigger' && (
                <label className={styles.field}>Conexão do gatilho
                    <select className={styles.select} value={connectionId || ''} onChange={(e) => onConnection(Number(e.target.value) || null)}>
                        <option value="">Selecione…</option>
                        {connections.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.app_label})</option>)}
                    </select>
                    {connections.length === 0 && <span>Nenhuma conexão. Crie uma em Integrações.</span>}
                </label>
            )}
            {subtype === 'webhook_in' && <p className={styles.muted}>Ao salvar, o servidor gera a URL secreta que seu sistema deve chamar (aparece em “Detalhes” da automação).</p>}

            {subtype === 'send_whatsapp' && (
                <>
                    <label className={styles.field}>Número do destinatário
                        <input className={styles.input} placeholder="{{telefone}}" value={cfg.number || ''} onChange={(e) => set({ number: e.target.value })} />
                        <span>Deixe vazio para usar {'{{telefone}}'} do evento.</span>
                    </label>
                    <label className={styles.field}>Mensagem
                        <textarea className={styles.textarea} placeholder="Olá {{nome}}, seu prazo vence em 3 dias." value={cfg.text || ''} onChange={(e) => set({ text: e.target.value })} />
                    </label>
                </>
            )}

            {subtype === 'send_email' && (
                <>
                    <label className={styles.field}>Para (e-mail)
                        <input className={styles.input} placeholder="{{email}}" value={cfg.to || ''} onChange={(e) => set({ to: e.target.value })} />
                        <span>Vazio usa {'{{email}}'} do evento.</span>
                    </label>
                    <label className={styles.field}>Assunto
                        <input className={styles.input} placeholder="Atualização do seu processo" value={cfg.subject || ''} onChange={(e) => set({ subject: e.target.value })} />
                    </label>
                    <label className={styles.field}>Mensagem
                        <textarea className={styles.textarea} placeholder="Olá {{nome}}, ..." value={cfg.body || ''} onChange={(e) => set({ body: e.target.value })} />
                    </label>
                </>
            )}

            {subtype === 'webhook' && (
                <>
                    <label className={styles.field}>URL (https)
                        <input className={styles.input} placeholder="https://sistema.exemplo.com/hook" value={cfg.url || ''} onChange={(e) => set({ url: e.target.value })} />
                    </label>
                    <label className={styles.field}>Corpo (JSON)
                        <textarea className={styles.textarea} placeholder='{"processo": "{{numero}}"}' value={cfg.payload || ''} onChange={(e) => set({ payload: e.target.value })} />
                    </label>
                    <p className={styles.muted}>Por segurança, o servidor não chama endereços internos/privados.</p>
                </>
            )}
        </aside>
    );
}
