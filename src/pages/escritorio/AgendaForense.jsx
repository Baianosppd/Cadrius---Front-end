import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, Pill, PageHeader, errorMessage } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import useLoader from '../gestao/useLoader';
import { brDate, forenseApi } from '../../services/rules';

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
        <div className={styles.card}>
            <div className={styles.card_title}>Calcular prazo</div>
            <form className={styles.filters} onSubmit={calc}>
                <label className={styles.field}>{form.disponibilizacao ? 'Disponibilizado no Diário em' : 'Intimação / publicação em'}
                    <input className={styles.input} type="date" value={form.inicio} onChange={set('inicio')} required />
                </label>
                <label className={styles.field}>Prazo (dias úteis)<input className={styles.input} type="number" min={1} max={365} value={form.dias} onChange={set('dias')} /></label>
                <label className={styles.field}>Tribunal (opcional, ex.: tjsp, trf3)<input className={styles.input} value={form.tribunal} onChange={set('tribunal')} maxLength={12} /></label>
                <label className={styles.check_row}><input type="checkbox" checked={form.disponibilizacao} onChange={set('disponibilizacao')} /> Data de disponibilização no DJe</label>
                <button type="submit" className={`${styles.btn} ${styles.btn_primary}`}>Calcular</button>
            </form>
            {error && <Banner tone="error">{error}</Banner>}
            {result && (
                <div style={{ marginTop: 12 }}>
                    {result.publicacao && <div>Publicação considerada em <strong>{brDate(result.publicacao)}</strong> (1º dia útil após a disponibilização).</div>}
                    <div style={{ fontSize: 20, margin: '6px 0' }}>Vencimento: <strong>{brDate(result.vencimento)}</strong></div>
                    {result.pulados.length > 0 && (
                        <details>
                            <summary>{result.pulados.length} dia(s) não contado(s)</summary>
                            <ul>{result.pulados.map((p) => <li key={p.data}>{brDate(p.data)} — {p.motivo}</li>)}</ul>
                        </details>
                    )}
                    <Banner tone="warn">{result.aviso}</Banner>
                </div>
            )}
        </div>
    );
}

function Feriados({ canManage }) {
    const { data, error, reload } = useLoader(() => forenseApi.feriados(), []);
    const [form, setForm] = useState({ data: '', nome: '', tribunal: '', anual: false });
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    const add = async (e) => {
        e.preventDefault();
        try {
            await forenseApi.addFeriado(form);
            toast.success('Feriado cadastrado.');
            setForm({ data: '', nome: '', tribunal: '', anual: false });
            reload();
        } catch (err) { toast.error(errorMessage(err)); }
    };
    const remove = async (h) => {
        if (!window.confirm(`Remover "${h.nome}"?`)) return;
        try { await forenseApi.removeFeriado(h.id); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <div className={styles.card}>
            <div className={styles.card_title}>Feriados e suspensões do escritório</div>
            <p className={styles.muted}>
                Já considerados automaticamente: fins de semana, feriados nacionais, Carnaval, Sexta-feira Santa, Corpus Christi e o recesso de
                20/12 a 20/01 (CPC art. 220); na Justiça Federal (trf), também os dias da Lei 5.010/66. Cadastre aqui os municipais, estaduais e do tribunal.
            </p>
            {canManage && (
                <form className={styles.filters} onSubmit={add}>
                    <label className={styles.field}>Data<input className={styles.input} type="date" value={form.data} onChange={set('data')} required /></label>
                    <label className={styles.field} style={{ flex: 2 }}>Nome<input className={styles.input} value={form.nome} onChange={set('nome')} maxLength={120} required /></label>
                    <label className={styles.field}>Só no tribunal (opcional)<input className={styles.input} value={form.tribunal} onChange={set('tribunal')} maxLength={12} placeholder="tjsp" /></label>
                    <label className={styles.check_row}><input type="checkbox" checked={form.anual} onChange={set('anual')} /> Repete todo ano</label>
                    <button type="submit" className={styles.btn}>Adicionar</button>
                </form>
            )}
            {error && <Banner tone="error">{error}</Banner>}
            {data && data.length === 0 && <Empty>Nenhum feriado local cadastrado.</Empty>}
            {data && data.length > 0 && (
                <table className={styles.table}>
                    <thead><tr><th>Data</th><th>Nome</th><th>Vale para</th><th></th></tr></thead>
                    <tbody>
                        {data.map((h) => (
                            <tr key={h.id}>
                                <td>{h.anual ? brDate(h.data).slice(0, 5) : brDate(h.data)} {h.anual && <Pill tone="blue">todo ano</Pill>}</td>
                                <td>{h.nome}</td>
                                <td>{h.tribunal || 'todos os tribunais'}</td>
                                <td>{canManage && <button type="button" className={styles.btn} onClick={() => remove(h)}>Remover</button>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default function AgendaForense() {
    const { isOrgManager } = useAuth();
    return (
        <div className={styles.page}>
            <PageHeader title="Agenda forense" subtitle="Prazos em dias úteis com feriados, recesso e o calendário do seu tribunal" />
            <Calculadora />
            <Feriados canManage={isOrgManager} />
        </div>
    );
}
