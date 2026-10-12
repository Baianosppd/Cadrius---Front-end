import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCopy } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import a from './Assistant.module.css';
import { Banner, Button, Chip, Field, Input, Row, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
import { PROVIDER_LABEL, WRITE_ACTIONS, assistantApi } from '../../services/assistant';

const FIELD_LABEL = { partes: 'Partes', processo_cnj: 'Processo', tribunal: 'Tribunal', datas: 'Datas', prazos: 'Prazos', valores: 'Valores',
    pedidos: 'Pedidos', resumo: 'Resumo' };

function show(value) {
    if (value === null || value === undefined || value === '') return '—';
    if (Array.isArray(value)) return value.length ? value.map((v) => (typeof v === 'object' ? Object.values(v).filter(Boolean).join(' — ') : v)).join('; ') : '—';
    if (typeof value === 'object') return Object.values(value).filter(Boolean).join(' — ');
    return String(value);
}

// Corrigir, reescrever, resumir e extrair dados de qualquer texto colado (CAD-221)
export default function TextTools() {
    const [text, setText] = useState('');
    const [action, setAction] = useState('corrigir');
    const [extra, setExtra] = useState('');
    const [out, setOut] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const run = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            setOut(await assistantApi.write(action, text, extra));
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(out.texto);
            toast.success('Copiado.');
        } catch { toast.error('Não foi possível copiar.'); }
    };
    return (
        <div className={a.writer}>
            <form className={styles.card} onSubmit={run}>
                <div className={styles.card_title}>Seu texto</div>
                <Textarea className={a.writer_text} value={text} maxLength={20000} aria-label="Texto"
                    placeholder="Cole aqui uma publicação, um e-mail, um trecho de peça…" onChange={(e) => setText(e.target.value)} />
                <Row gap={1} role="group" aria-label="O que fazer">
                    {WRITE_ACTIONS.map((w) => <Chip key={w.key} active={action === w.key} onClick={() => setAction(w.key)}>{w.label}</Chip>)}
                </Row>
                <Field label="Orientação extra (opcional)">
                    <Input value={extra} maxLength={500} onChange={(e) => setExtra(e.target.value)} placeholder="Ex.: tom mais cordial; cite o art. 1.694 do CC" />
                </Field>
                {error && <Banner tone="error">{error}</Banner>}
                <Row>
                    <Button type="submit" variant="primary" loading={busy} loadingLabel="Processando…" disabled={!text.trim()}>Aplicar</Button>
                </Row>
            </form>
            <div className={styles.card}>
                <div className={styles.card_title}>Resultado {out?.provedor && <span className={styles.muted}>· via {PROVIDER_LABEL[out.provedor] || out.provedor}</span>}</div>
                {!out && <div className={styles.muted}>O resultado aparece aqui. Confira sempre antes de usar: a IA pode errar.</div>}
                {out && out.dados && typeof out.dados === 'object' ? (
                    <div>
                        {Object.entries(out.dados).map(([k, v]) => (
                            <div key={k} className={styles.kv}><span className={styles.muted}>{FIELD_LABEL[k] || k}</span><span className={styles.text_right}>{show(v)}</span></div>
                        ))}
                    </div>
                ) : out && <div className={a.result}>{out.texto}</div>}
                {out && !out.dados && (
                    <Row>
                        <Button icon={FiCopy} onClick={copy}>Copiar</Button>
                        <Button onClick={() => { setText(out.texto); setOut(null); }}>Usar como novo texto</Button>
                    </Row>
                )}
            </div>
        </div>
    );
}
