import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../ui/ui.module.css';
import { Banner, Button, Checkbox, Field, FilterBar, Input, Modal } from '../ui';
import { errorMessage } from '../../utils/format';
import { contactsApi } from '../../services/contacts';
import { integrationsApi } from '../../services/integrations';

// Enviar PDF para assinatura no ZapSign (CAD-174): signatários vêm do quadro de contatos
export default function AssinaturaModal({ documentId, documentName, onClose }) {
    const [q, setQ] = useState('');
    const [found, setFound] = useState([]);
    const [chosen, setChosen] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const search = async (e) => {
        e.preventDefault();
        try { setFound((await contactsApi.list({ q: q.trim() })).resultados || []); } catch (err) { setError({ msg: errorMessage(err) }); }
    };
    const toggle = (c) => setChosen((list) => (list.some((x) => x.id === c.id) ? list.filter((x) => x.id !== c.id) : [...list, c].slice(0, 10)));
    const send = async () => {
        setBusy(true); setError(null);
        try { setResult(await integrationsApi.signature({ documento_id: documentId, signatarios: chosen.map((c) => c.id) })); }
        catch (err) { setError({ msg: errorMessage(err), notConnected: err?.response?.data?.code === 'not_connected' }); } finally { setBusy(false); }
    };
    return (
        // Com signatários escolhidos, clique fora não fecha (não perde a seleção)
        <Modal title="Enviar para assinatura" onClose={onClose} busy={busy} closeOnOverlay={!chosen.length || !!result}
            footer={result ? <Button onClick={onClose}>Fechar</Button> : <>
                <Button variant="primary" disabled={!chosen.length} loading={busy} loadingLabel="Enviando…" onClick={send}>Enviar</Button>
                <Button onClick={onClose} disabled={busy}>Cancelar</Button>
            </>}>
            <p className={`${styles.muted} ${styles.mt_0}`}>{documentName} · via ZapSign. Cada signatário recebe o link por e-mail.</p>
            {result ? (
                <>
                    <Banner tone="ok">Documento enviado. Links individuais:</Banner>
                    {result.signatarios.map((s) => (
                        <div key={s.link || s.nome} className={styles.kv}><span>{s.nome}</span>
                            {s.link && <a href={s.link} target="_blank" rel="noreferrer noopener">abrir link</a>}</div>
                    ))}
                </>
            ) : (
                <>
                    <FilterBar as="form" onSubmit={search}>
                        <Field label="Buscar signatário no quadro de contatos">
                            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, CPF ou e-mail" />
                        </Field>
                        <Button type="submit">Buscar</Button>
                    </FilterBar>
                    {found.map((c) => (
                        <Checkbox key={c.id} checked={chosen.some((x) => x.id === c.id)} onChange={() => toggle(c)} disabled={!c.email && !c.phone}>
                            {c.name} <span className={styles.muted}>{c.email || c.phone || 'sem e-mail/telefone'}</span>
                        </Checkbox>
                    ))}
                    {chosen.length > 0 && <div className={styles.muted}>Selecionados: {chosen.map((c) => c.name).join(', ')}</div>}
                    {error && <Banner tone="error">{error.msg} {error.notConnected && <Link to="/integracoes">Conectar o ZapSign</Link>}</Banner>}
                </>
            )}
        </Modal>
    );
}
