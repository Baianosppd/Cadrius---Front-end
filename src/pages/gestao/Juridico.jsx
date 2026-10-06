import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiTrash2 } from 'react-icons/fi';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, errorMessage, fmtDate } from '../../components/seguranca/ui';
import useLoader from './useLoader';
import { courtsApi } from '../../services/cad223';

const KINDS = [['prazos', 'Suspensão de prazos'], ['expediente', 'Sem expediente forense'], ['indisponibilidade', 'Indisponibilidade do sistema (prorroga prazos)']];

// Gestão Cadrius → Jurídico (CAD-223): calendário forense nacional e serviços dos tribunais.
export default function Juridico() {
    const { data, error, reload } = useLoader(() => courtsApi.staffSuspensions(), []);
    const courts = useLoader(() => courtsApi.staffCourts(), []);
    const [f, setF] = useState({ tribunal: '', comarca: '', tipo: 'prazos', inicio: '', fim: '', motivo: '', fonte: '' });
    const [c, setC] = useState({ tribunal: '', nome: '', balcao_virtual: '', servicos: '', pauta: '', horario: '', observacoes: '' });
    const save = async (e) => {
        e.preventDefault();
        try {
            const r = await courtsApi.staffSave({ ...f, fim: f.fim || f.inicio });
            toast.success(`Suspensão cadastrada. Escritórios avisados: ${r.escritorios_avisados}.`);
            setF({ tribunal: '', comarca: '', tipo: 'prazos', inicio: '', fim: '', motivo: '', fonte: '' });
            reload();
        } catch (err) { toast.error(errorMessage(err)); }
    };
    const remove = async (s) => {
        if (!window.confirm('Apagar esta suspensão? Ela deixa de contar nos prazos dos escritórios.')) return;
        try { await courtsApi.staffRemove(s.id); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    const saveCourt = async (e) => {
        e.preventDefault();
        try { await courtsApi.staffSaveCourt(c); toast.success('Tribunal salvo.'); setC({ tribunal: '', nome: '', balcao_virtual: '', servicos: '', pauta: '', horario: '', observacoes: '' }); courts.reload(); }
        catch (err) { toast.error(errorMessage(err)); }
    };
    const set = (setter, obj) => (k) => (e) => setter({ ...obj, [k]: e.target.value });
    const sf = set(setF, f);
    const sc = set(setC, c);
    return (
        <div className={styles.page}>
            <PageHeader title="Jurídico" subtitle="Calendário forense nacional: suspensões de prazo e serviços dos tribunais" />
            <Banner tone="info">Cadastre só com o <strong>link do ato oficial</strong> (portaria, certidão ou aviso do tribunal). A suspensão entra na contagem de
                prazos de todos os escritórios e avisa, pelo gatilho "Suspensão de prazos no tribunal", quem tem processo ali. Suspensão só de uma comarca
                aparece como aviso, mas não entra na contagem automática.</Banner>
            <form className={styles.card} onSubmit={save}>
                <div className={styles.section_title}>Nova suspensão / indisponibilidade</div>
                <div className={styles.filters}>
                    <label className={styles.field}>Tribunal (sigla; vazio = nacional)<input className={styles.input} value={f.tribunal} onChange={sf('tribunal')} placeholder="tjsp" /></label>
                    <label className={styles.field}>Comarca (opcional)<input className={styles.input} value={f.comarca} onChange={sf('comarca')} /></label>
                    <label className={styles.field}>Tipo<select className={styles.select} value={f.tipo} onChange={sf('tipo')}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                </div>
                <div className={styles.filters}>
                    <label className={styles.field}>Início<input className={styles.input} type="date" required value={f.inicio} onChange={sf('inicio')} /></label>
                    <label className={styles.field}>Fim<input className={styles.input} type="date" value={f.fim} onChange={sf('fim')} /></label>
                    <label className={styles.field} style={{ flex: 2 }}>Motivo<input className={styles.input} required value={f.motivo} onChange={sf('motivo')} placeholder="Portaria 603/2026 — migração do sistema" /></label>
                </div>
                <label className={styles.field}>Link do ato oficial (https://)<input className={styles.input} required type="url" value={f.fonte} onChange={sf('fonte')} /></label>
                <div className={styles.btn_row}><button type="submit" className={`${styles.btn} ${styles.btn_primary}`}>Cadastrar e avisar escritórios</button></div>
            </form>
            {error && <Banner tone="error">{error}</Banner>}
            {data && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Tribunal</th><th>Período</th><th>Tipo</th><th>Motivo</th><th></th></tr></thead>
                        <tbody>
                            {data.length === 0 && <tr><td colSpan={5}><Empty>Nenhuma suspensão cadastrada.</Empty></td></tr>}
                            {data.map((s) => (
                                <tr key={s.id}>
                                    <td><Pill>{s.tribunal}</Pill>{s.comarca && <div className={styles.muted}>{s.comarca}</div>}</td>
                                    <td>{fmtDate(s.inicio)} a {fmtDate(s.fim)}</td>
                                    <td>{s.tipo_label}</td>
                                    <td>{s.motivo} <a href={s.fonte} target="_blank" rel="noreferrer noopener">ato</a></td>
                                    <td><button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_danger}`} aria-label="Apagar suspensão" onClick={() => remove(s)}><FiTrash2 aria-hidden="true" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <form className={styles.card} onSubmit={saveCourt}>
                <div className={styles.section_title}>Serviços de um tribunal (Balcão Virtual, custas, pauta)</div>
                <div className={styles.filters}>
                    <label className={styles.field}>Sigla<input className={styles.input} required value={c.tribunal} onChange={sc('tribunal')} placeholder="tjsp" /></label>
                    <label className={styles.field} style={{ flex: 2 }}>Nome<input className={styles.input} required value={c.nome} onChange={sc('nome')} /></label>
                    <label className={styles.field}>Horário<input className={styles.input} value={c.horario} onChange={sc('horario')} placeholder="12h às 18h" /></label>
                </div>
                <div className={styles.filters}>
                    <label className={styles.field}>Balcão Virtual<input className={styles.input} type="url" value={c.balcao_virtual} onChange={sc('balcao_virtual')} /></label>
                    <label className={styles.field}>Serviços / custas<input className={styles.input} type="url" value={c.servicos} onChange={sc('servicos')} /></label>
                    <label className={styles.field}>Pauta<input className={styles.input} type="url" value={c.pauta} onChange={sc('pauta')} /></label>
                </div>
                <label className={styles.field}>Observações<input className={styles.input} value={c.observacoes} onChange={sc('observacoes')} /></label>
                <div className={styles.btn_row}><button type="submit" className={styles.btn}>Salvar tribunal</button></div>
                {courts.data && courts.data.length > 0 && <p className={styles.muted}>Cadastrados: {courts.data.map((x) => x.sigla).join(', ')}.</p>}
            </form>
        </div>
    );
}
