import { FiX } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import s from './NodeInspector.module.css';
import { Button, Field, Input, Row, Select, Stack, Textarea } from '../ui';

// Painel de propriedades do nó selecionado (config vai em node.data.config e vira o payload do back)
export default function NodeInspector({ node, connections, connectionId, onConnection, onChange, onClose }) {
    if (!node) return null;
    const { subtype } = node.data;
    const cfg = node.data.config || {};
    const set = (patch) => onChange(node.id, { config: { ...cfg, ...patch } });

    return (
        <Stack as="aside" gap={3} className={s.panel} aria-label="Propriedades do nó">
            <Row justify="between" wrap={false}>
                <strong>{node.data.label}</strong>
                <Button size="sm" variant="ghost" icon={FiX} onClick={onClose} aria-label="Fechar painel" />
            </Row>

            {node.data.type === 'trigger' && (
                <Field label="Conexão do gatilho" hint={connections.length === 0 ? 'Nenhuma conexão. Crie uma em Integrações.' : undefined}>
                    <Select value={connectionId || ''} onChange={(e) => onConnection(Number(e.target.value) || null)}>
                        <option value="">Selecione…</option>
                        {connections.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.app_label})</option>)}
                    </Select>
                </Field>
            )}
            {subtype === 'webhook_in' && <p className={styles.muted}>Ao salvar, o servidor gera a URL secreta que seu sistema deve chamar (aparece em “Detalhes” da automação).</p>}

            {subtype === 'send_whatsapp' && (
                <>
                    <Field label="Número do destinatário" hint={<>Deixe vazio para usar {'{{telefone}}'} do evento.</>}>
                        <Input placeholder="{{telefone}}" value={cfg.number || ''} onChange={(e) => set({ number: e.target.value })} />
                    </Field>
                    <Field label="Mensagem">
                        <Textarea placeholder="Olá {{nome}}, seu prazo vence em 3 dias." value={cfg.text || ''} onChange={(e) => set({ text: e.target.value })} />
                    </Field>
                </>
            )}

            {subtype === 'send_email' && (
                <>
                    <Field label="Para (e-mail)" hint={<>Vazio usa {'{{email}}'} do evento.</>}>
                        <Input placeholder="{{email}}" value={cfg.to || ''} onChange={(e) => set({ to: e.target.value })} />
                    </Field>
                    <Field label="Assunto">
                        <Input placeholder="Atualização do seu processo" value={cfg.subject || ''} onChange={(e) => set({ subject: e.target.value })} />
                    </Field>
                    <Field label="Mensagem">
                        <Textarea placeholder="Olá {{nome}}, ..." value={cfg.body || ''} onChange={(e) => set({ body: e.target.value })} />
                    </Field>
                </>
            )}

            {subtype === 'webhook' && (
                <>
                    <Field label="URL (https)">
                        <Input placeholder="https://sistema.exemplo.com/hook" value={cfg.url || ''} onChange={(e) => set({ url: e.target.value })} />
                    </Field>
                    <Field label="Corpo (JSON)">
                        <Textarea placeholder='{"processo": "{{numero}}"}' value={cfg.payload || ''} onChange={(e) => set({ payload: e.target.value })} />
                    </Field>
                    <p className={styles.muted}>Por segurança, o servidor não chama endereços internos/privados.</p>
                </>
            )}
        </Stack>
    );
}
