import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../seguranca/seguranca.module.css';
import { Banner, errorMessage } from '../seguranca/ui';
import { integrationsApi } from '../../services/integrations';

// Cobrança de honorários pelo Asaas (CAD-174): boleto/Pix para um contato com CPF/CNPJ
export default function CobrancaModal({ contact, onClose }) {
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const [form, setForm] = useState({ valor: '', vencimento: in7, descricao: 'Honorários advocatícios', forma: 'UNDEFINED' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError(null);
        try { setResult(await integrationsApi.charge({ contato_id: contact.id, ...form })); }
        catch (err) { setError({ msg: errorMessage(err), notConnected: err?.response?.data?.code === 'not_connected' }); } finally { setBusy(false); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="cob-title" onClick={onClose}>
            <form className={styles.modal} style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
                <h2 id="cob-title" className={styles.modal_title}>Cobrar {contact.name}</h2>
                {result ? (
                    <>
                        <Banner tone="ok">Cobrança criada no Asaas ({result.status}).</Banner>
                        {result.link && <a className={`${styles.btn} ${styles.btn_primary}`} href={result.link} target="_blank" rel="noreferrer noopener">Abrir fatura para enviar ao cliente</a>}
                        {result.boleto && <a className={styles.btn} href={result.boleto} target="_blank" rel="noreferrer noopener">Boleto (PDF)</a>}
                        <button type="button" className={styles.btn} onClick={onClose}>Fechar</button>
                    </>
                ) : (
                    <>
                        <div className={styles.filters}>
                            <label className={styles.field}>Valor (R$)<input className={styles.input} inputMode="decimal" value={form.valor} required placeholder="1.500,00"
                                onChange={(e) => setForm({ ...form, valor: e.target.value.replace(/\./g, '') })} /></label>
                            <label className={styles.field}>Vencimento<input className={styles.input} type="date" value={form.vencimento} required onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></label>
                        </div>
                        <label className={styles.field}>Forma
                            <select className={styles.select} value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value })}>
                                <option value="UNDEFINED">O cliente escolhe (boleto ou Pix)</option><option value="BOLETO">Boleto</option><option value="PIX">Pix</option>
                            </select>
                        </label>
                        <label className={styles.field}>Descrição<input className={styles.input} value={form.descricao} maxLength={500} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></label>
                        {error && <Banner tone="error">{error.msg} {error.notConnected && <Link to="/integracoes">Ir para Integrações</Link>}</Banner>}
                        <div className={styles.btn_row}>
                            <button className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>{busy ? 'Gerando…' : 'Gerar cobrança'}</button>
                            <button type="button" className={styles.btn} onClick={onClose}>Cancelar</button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
