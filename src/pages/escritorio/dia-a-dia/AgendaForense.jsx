import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../../components/ui/ui.module.css';
import s from '../../../components/forense/Forense.module.css';
import { Banner, Button, Checkbox, Empty, Field, FilterBar, Input, Pill, PageHeader, Stack, Table } from '../../../components/ui';
import { errorMessage } from '../../../utils/format';
import useAuth from '../../../hooks/useAuth';
import useLoader from '../../../hooks/useLoader';
import { brDate, forenseApi } from '../../../services/rules';
import { ServicosTribunais, SuspensoesTribunais } from '../../../components/forense/Tribunais';

// Calculadora de prazo em dias úteis (CPC arts. 219, 220 e 224) + feriados locais/do tribunal cadastrados pelo escritório (CAD-172)
function Calculadora() {
    const [form, setForm] = useState({ inicio: '', dias: 15, tribunal: '', disponibilizacao: false });
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    const calc = async (e) => {
        e.preventDefault();
        setError('');
        try {
            setResult(await forenseApi.prazo({ inicio: form.inicio, dias: form.dias, tribunal: form.tribunal.trim().toLowerCase(),
                disponibilizacao: form.disponibilizacao ? '1' : undefined }));
        } catch (err) {
            setResult(null);
            setError(errorMessage(err));
        }
    };
    return (
        <Stack gap={3} className={styles.card}>
            <div className={`${styles.card_title} ${styles.mb_0}`}>Calcular prazo</div>
            <FilterBar as="form" onSubmit={calc}>
                <Field label={form.disponibilizacao ? 'Disponibilizado no Diário em' : 'Intimação / publicação em'}>
                    <Input type="date" value={form.inicio} onChange={set('inicio')} required />
                </Field>
                <Field label="Prazo (dias úteis)"><Input type="number" min={1} max={365} value={form.dias} onChange={set('dias')} /></Field>
                <Field label="Tribunal (opcional)" hint="Ex.: tjsp, trf3"><Input value={form.tribunal} onChange={set('tribunal')} maxLength={12} /></Field>
                <Checkbox checked={form.disponibilizacao} onChange={set('disponibilizacao')}>Data de disponibilização no DJe</Checkbox>
                <Button type="submit" variant="primary">Calcular</Button>
            </FilterBar>
            {error && <Banner tone="error">{error}</Banner>}
            {result && (
                <Stack gap={2} role="status">
                    {result.publicacao && <div>Publicação considerada em <strong>{brDate(result.publicacao)}</strong> (1º dia útil após a disponibilização).</div>}
                    <div className={s.vencimento}>Vencimento: <strong>{brDate(result.vencimento)}</strong></div>
                    {result.pulados.length > 0 && (
                        <details>
                            <summary className={styles.clickable}>{result.pulados.length} dia(s) não contado(s)</summary>
                            <ul className={styles.list_indent}>{result.pulados.map((p) => <li key={p.data}>{brDate(p.data)} — {p.motivo}</li>)}</ul>
                        </details>
                    )}
                    <Banner tone="warn">{result.aviso}</Banner>
                </Stack>
            )}
        </Stack>
    );
}

const EMPTY = { data: '', nome: '', tribunal: '', anual: false };

function Feriados({ canManage }) {
    const { data, error, reload } = useLoader(() => forenseApi.feriados(), []);
    const [form, setForm] = useState(EMPTY);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    const add = async (e) => {
        e.preventDefault();
        try {
            await forenseApi.addFeriado(form);
            toast.success('Feriado cadastrado.');
            setForm(EMPTY);
            reload();
        } catch (err) { toast.error(errorMessage(err)); }
    };
    const remove = async (h) => {
        if (!window.confirm(`Remover "${h.nome}"?`)) return;
        try { await forenseApi.removeFeriado(h.id); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <Stack gap={3} className={styles.card}>
            <div className={`${styles.card_title} ${styles.mb_0}`}>Feriados e suspensões do escritório</div>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>
                Já considerados automaticamente: fins de semana, feriados nacionais, Carnaval, Sexta-feira Santa, Corpus Christi e o recesso de
                20/12 a 20/01 (CPC art. 220); na Justiça Federal (trf), também os dias da Lei 5.010/66. Cadastre aqui os municipais, estaduais e do tribunal.
            </p>
            {canManage && (
                <FilterBar as="form" onSubmit={add}>
                    <Field label="Data"><Input type="date" value={form.data} onChange={set('data')} required /></Field>
                    <Field label="Nome" className={styles.flex_2}><Input value={form.nome} onChange={set('nome')} maxLength={120} required /></Field>
                    <Field label="Só no tribunal (opcional)"><Input value={form.tribunal} onChange={set('tribunal')} maxLength={12} placeholder="tjsp" /></Field>
                    <Checkbox checked={form.anual} onChange={set('anual')}>Repete todo ano</Checkbox>
                    <Button type="submit">Adicionar</Button>
                </FilterBar>
            )}
            {error && <Banner tone="error">{error}</Banner>}
            {data && data.length === 0 && <Empty>Nenhum feriado local cadastrado.</Empty>}
            {data && data.length > 0 && (
                <Table flat columns={['Data', 'Nome', 'Vale para', { label: '', className: styles.td_actions }]}>
                    {data.map((h) => (
                        <tr key={h.id}>
                            <td>{h.anual ? brDate(h.data).slice(0, 5) : brDate(h.data)} {h.anual && <Pill tone="blue">todo ano</Pill>}</td>
                            <td data-label="Nome">{h.nome}</td>
                            <td data-label="Vale para">{h.tribunal || 'todos os tribunais'}</td>
                            <td className={styles.td_actions}>{canManage && <Button size="sm" variant="danger" onClick={() => remove(h)}>Remover</Button>}</td>
                        </tr>
                    ))}
                </Table>
            )}
        </Stack>
    );
}

export default function AgendaForense() {
    const { isOrgManager } = useAuth();
    return (
        <div className={styles.page}>
            <PageHeader title="Agenda forense" subtitle="Prazos em dias úteis por tribunal" />
            <Calculadora />
            <SuspensoesTribunais />
            <Feriados canManage={isOrgManager} />
            <ServicosTribunais />
        </div>
    );
}
