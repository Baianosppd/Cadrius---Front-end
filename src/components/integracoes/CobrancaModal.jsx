import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../ui/ui.module.css';
import { Banner, Button, FormModal, Modal, MoneyInput } from '../ui';
import useSubmit from '../../hooks/useSubmit';
import { integrationsApi } from '../../services/integrations';

// Cobrança de honorários pelo Asaas (CAD-174): boleto/Pix para um contato com CPF/CNPJ
export default function CobrancaModal({ contact, onClose }) {
    // Vencimento padrão: daqui a 7 dias (calculado só ao abrir)
    const [form, setForm] = useState(() => ({
        valor: '', vencimento: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
        descricao: 'Honorários advocatícios', forma: 'UNDEFINED',
    }));
    const [result, setResult] = useState(null);
    const { busy, error, falha, submit } = useSubmit(
        // O back espera "1500,00" (sem o ponto de milhar)
        () => integrationsApi.charge({ contato_id: contact.id, ...form, valor: form.valor.replace(/\./g, '') }),
        { onDone: setResult },
    );
    const naoConectado = falha?.response?.data?.code === 'not_connected';
    const title = `Cobrar ${contact.name}`;

    // Depois de gerar: mesma janela, agora só com o resultado
    if (result) return (
        <Modal title={title} onClose={onClose}
            footer={<Button onClick={onClose}>Fechar</Button>}>
            <Banner tone="ok">Cobrança criada no Asaas ({result.status}). Ela já aparece em <Link to="/financas">Finanças → A receber</Link> e recebe baixa sozinha quando o webhook estiver configurado.</Banner>
            {result.link && <Button as="a" variant="primary" href={result.link} target="_blank" rel="noreferrer noopener">Abrir fatura para enviar ao cliente</Button>}
            {result.boleto && <Button as="a" href={result.boleto} target="_blank" rel="noreferrer noopener">Boleto (PDF)</Button>}
        </Modal>
    );

    return (
        <FormModal title={title} onClose={onClose} onSubmit={submit} busy={busy}
            submitLabel="Gerar cobrança" busyLabel="Gerando…"
            error={error && <>{error} {naoConectado && <Link to="/integracoes">Ir para Integrações</Link>}</>}>
            <div className={styles.filters}>
                <label className={styles.field}>Valor (R$)<MoneyInput value={form.valor} required onChange={(v) => setForm({ ...form, valor: v })} /></label>
                <label className={styles.field}>Vencimento<input className={styles.input} type="date" value={form.vencimento} required onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></label>
            </div>
            <label className={styles.field}>Forma
                <select className={styles.select} value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value })}>
                    <option value="UNDEFINED">O cliente escolhe (boleto ou Pix)</option><option value="BOLETO">Boleto</option><option value="PIX">Pix</option>
                </select>
            </label>
            <label className={styles.field}>Descrição<input className={styles.input} value={form.descricao} maxLength={500} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></label>
        </FormModal>
    );
}
