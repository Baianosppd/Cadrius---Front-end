import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCopy, FiTrash2 } from 'react-icons/fi';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, errorMessage, Loading, Pill, StatCard } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
import { brl, leadsApi } from '../../services/cad223';

const publicUrl = (path) => `${window.location.origin}${path}`;

// Formulários de captação (CAD-223): viram contato + oportunidade, com consentimento LGPD e checagem OAB do texto.
export function Captacao({ canWrite }) {
    const { data, error, reload } = useLoader(() => leadsApi.forms(), []);
    const [f, setF] = useState({ titulo: 'Fale com o escritório', apresentacao: '', assuntos: '', revisado: false });
    const [alerts, setAlerts] = useState('');
    const create = async (e) => {
        e.preventDefault();
        setAlerts('');
        try {
            await leadsApi.createForm({ ...f, assuntos: f.assuntos.split(',').map((x) => x.trim()).filter(Boolean) });
            toast.success('Formulário criado. Copie o link e coloque no site ou na bio.');
            setF({ titulo: '', apresentacao: '', assuntos: '', revisado: false });
            reload();
        } catch (err) { setAlerts(errorMessage(err)); }
    };
    const toggle = async (form) => { try { await leadsApi.updateForm(form.id, { ativo: !form.ativo }); reload(); } catch (err) { toast.error(errorMessage(err)); } };
    const remove = async (form) => {
        if (!window.confirm('Apagar o formulário? Os contatos já recebidos continuam no Cadrius.')) return;
        try { await leadsApi.removeForm(form.id); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <div className={styles.stack}>
            <p className={styles.muted} style={{ margin: 0 }}>Cada envio vira contato e oportunidade no funil, com o consentimento do visitante.</p>
            {canWrite && (
                <form className={styles.card} onSubmit={create}>
                    <div className={styles.section_title}>Novo formulário</div>
                    <div className={styles.grid}>
                        <label className={styles.field}>Título<input className={styles.input} required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></label>
                        <label className={styles.field}>Assuntos (separados por vírgula)<input className={styles.input} value={f.assuntos} onChange={(e) => setF({ ...f, assuntos: e.target.value })} placeholder="Previdenciário, Família, Trabalhista" /></label>
                    </div>
                    <label className={styles.field}>Apresentação (opcional)<textarea className={styles.textarea} value={f.apresentacao} maxLength={500} onChange={(e) => setF({ ...f, apresentacao: e.target.value })} /></label>
                    {alerts && <Banner tone="warn">{alerts}</Banner>}
                    {alerts.includes('OAB') && (
                        <label className={styles.check_row}><input type="checkbox" checked={f.revisado} onChange={(e) => setF({ ...f, revisado: e.target.checked })} /> Revisei o texto e assumo a responsabilidade</label>
                    )}
                    <div className={styles.btn_row}><button type="submit" className={`${styles.btn} ${styles.btn_primary}`}>Criar formulário</button></div>
                </form>
            )}
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && data.length === 0 && <Empty title="Nenhum formulário ainda">Crie um e coloque o link no site, no Google ou na bio do Instagram.</Empty>}
            {data && data.length > 0 && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Formulário</th><th>Envios</th><th>Situação</th><th>Link público</th><th></th></tr></thead>
                        <tbody>
                            {data.map((form) => (
                                <tr key={form.id}>
                                    <td><strong>{form.titulo}</strong>{form.alertas?.length > 0 && <div className={styles.muted}>{form.alertas.length} alerta(s) da checagem OAB</div>}</td>
                                    <td>{form.envios}</td>
                                    <td><Pill tone={form.ativo ? 'green' : 'gray'}>{form.ativo ? 'Ativo' : 'Pausado'}</Pill></td>
                                    <td>
                                        <div className={styles.btn_row}>
                                            <a className={`${styles.btn} ${styles.btn_sm}`} href={form.link} target="_blank" rel="noreferrer noopener">Abrir</a>
                                            <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => navigator.clipboard.writeText(publicUrl(form.link)).then(() => toast.success('Link copiado.'))}>
                                                <FiCopy aria-hidden="true" /> Copiar</button>
                                        </div>
                                    </td>
                                    <td>{canWrite && (
                                        <div className={styles.btn_row}>
                                            <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => toggle(form)}>{form.ativo ? 'Pausar' : 'Ativar'}</button>
                                            <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_danger}`} aria-label={`Apagar ${form.titulo}`} onClick={() => remove(form)}><FiTrash2 aria-hidden="true" /></button>
                                        </div>
                                    )}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function ResultTable({ rows, title }) {
    return (
        <div className={styles.table_wrap}>
            <table className={styles.table}>
                <thead><tr><th>{title}</th><th>Oportunidades</th><th>Fechadas</th><th>Não fecharam</th><th>Conversão</th><th>Honorários fechados</th></tr></thead>
                <tbody>
                    {rows.length === 0 && <tr><td colSpan={6}><Empty>Sem oportunidades no período.</Empty></td></tr>}
                    {rows.map((r) => (
                        <tr key={r.chave}><td><strong>{r.rotulo}</strong></td><td>{r.oportunidades}</td><td>{r.ganhas}</td><td>{r.perdidas}</td>
                            <td>{r.conversao_pct == null ? '—' : `${r.conversao_pct}%`}</td><td>{brl(r.valor_ganho_centavos)}</td></tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Origem dos clientes e satisfação (CAD-223)
export function Resultados() {
    const [dias, setDias] = useState(180);
    const { data, error } = useLoader(() => leadsApi.results(dias), [dias]);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const sat = data.satisfacao;
    return (
        <div className={styles.stack}>
            <div className={styles.btn_row}>
                {[90, 180, 365].map((n) => <button key={n} type="button" className={`${styles.chip} ${dias === n ? styles.chip_active : ''}`} onClick={() => setDias(n)}>Últimos {n} dias</button>)}
            </div>
            <div className={styles.grid}>
                <StatCard title="NPS (satisfação)" value={sat.nps == null ? '—' : sat.nps} tone={sat.nps == null ? undefined : sat.nps >= 50 ? 'green' : sat.nps < 0 ? 'red' : undefined}
                    note={`${sat.respostas} resposta(s) de ${sat.enviadas} pesquisa(s)`} />
                <StatCard title="Promotores" value={sat.promotores} tone="green" />
                <StatCard title="Neutros" value={sat.neutros} />
                <StatCard title="Detratores" value={sat.detratores} tone={sat.detratores ? 'red' : undefined} />
            </div>
            <ResultTable rows={data.por_origem} title="Origem" />
            <ResultTable rows={data.por_campanha} title="Campanha" />
            <p className={styles.muted}>Pesquisas de satisfação são enviadas pela automação "Pedir avaliação ao cliente" (veja os modelos em <Link to="/automacao">Automações</Link>). Vincule campanhas às oportunidades na Carteira para medir cada uma.</p>
        </div>
    );
}
