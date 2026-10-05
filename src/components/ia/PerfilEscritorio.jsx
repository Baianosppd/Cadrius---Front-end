import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, Pill, errorMessage } from '../seguranca/ui';
import useAuth from '../../hooks/useAuth';
import useLoader from '../../pages/gestao/useLoader';
import { brainApi } from '../../services/brain';

// Perfil do escritório (CAD-174): o que a IA usa para escrever "do jeito do escritório" em minutas e marketing
export default function PerfilEscritorio() {
    const { isOrgManager } = useAuth();
    const { data, error, reload } = useLoader(() => brainApi.profile(), []);
    const [form, setForm] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (data) setForm({ areas: data.areas, tom: data.tom, publico: data.publico, cidade: data.cidade, assinatura: data.assinatura, redes: data.redes || {} });
    }, [data]);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data || !form) return <Empty>Carregando…</Empty>;
    const calc = data.calculado || {};
    const toggleArea = (id) => setForm((f) => ({ ...f, areas: f.areas.includes(id) ? f.areas.filter((a) => a !== id) : [...f.areas, id] }));
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { await brainApi.saveProfile(form); toast.success('Perfil salvo. A IA passa a usar estas informações.'); reload(); }
        catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const ro = !isOrgManager;
    return (
        <div className={styles.two_col}>
            <form className={`${styles.card} ${styles.stack}`} onSubmit={save}>
                <div className={styles.section_title} style={{ marginBottom: 0 }}>Como o escritório se apresenta</div>
                <div className={styles.field}>Áreas de atuação
                    <div className={styles.btn_row} style={{ marginTop: 4 }}>
                        {data.opcoes_areas.map((a) => (
                            <button key={a.id} type="button" disabled={ro} className={`${styles.chip} ${form.areas.includes(a.id) ? styles.chip_active : ''}`}
                                aria-pressed={form.areas.includes(a.id)} onClick={() => toggleArea(a.id)}>{a.label}</button>
                        ))}
                    </div>
                </div>
                <label className={styles.field}>Tom de comunicação
                    <select className={styles.select} value={form.tom} disabled={ro} onChange={(e) => setForm({ ...form, tom: e.target.value })}>
                        {data.opcoes_tom.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                </label>
                <label className={styles.field}>Público que o escritório atende
                    <input className={styles.input} value={form.publico} disabled={ro} maxLength={200} placeholder="Ex.: trabalhadores da indústria e pequenas empresas"
                        onChange={(e) => setForm({ ...form, publico: e.target.value })} />
                </label>
                <label className={styles.field}>Cidade
                    <input className={styles.input} value={form.cidade} disabled={ro} maxLength={80} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                </label>
                <label className={styles.field}>Assinatura padrão das minutas
                    <textarea className={styles.textarea} value={form.assinatura} disabled={ro} maxLength={1000} placeholder={'Dra. Ana Lima\nOAB/PE 12.345'}
                        onChange={(e) => setForm({ ...form, assinatura: e.target.value })} />
                </label>
                <div className={styles.filters}>
                    {['site', 'instagram', 'linkedin'].map((k) => (
                        <label key={k} className={styles.field}>{k === 'site' ? 'Site' : k[0].toUpperCase() + k.slice(1)}
                            <input className={styles.input} value={form.redes[k] || ''} disabled={ro} onChange={(e) => setForm({ ...form, redes: { ...form.redes, [k]: e.target.value } })} />
                        </label>
                    ))}
                </div>
                {ro ? <Banner tone="info">Só dono ou administrador altera o perfil.</Banner> : (
                    <div className={styles.btn_row}><button className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>{busy ? 'Salvando…' : 'Salvar perfil'}</button></div>
                )}
            </form>
            <div className={`${styles.card} ${styles.stack}`}>
                <div className={styles.header_row} style={{ alignItems: 'center' }}>
                    <div className={styles.section_title} style={{ marginBottom: 0 }}>O que a IA percebeu nos seus dados</div>
                    <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => brainApi.profile(true).then(() => reload())}>Recalcular</button>
                </div>
                {(calc.areas_sugeridas || []).length > 0 && (
                    <div><div className={styles.muted} style={{ fontSize: '.8rem' }}>Áreas prováveis</div>
                        {calc.areas_sugeridas.map((a) => <Pill key={a} tone="blue">{data.opcoes_areas.find((o) => o.id === a)?.label || a}</Pill>)}</div>
                )}
                {[['tribunais', 'Tribunais mais frequentes'], ['classes', 'Classes processuais'], ['tipos_documento', 'Tipos de documento lidos']].map(([k, label]) => (
                    (calc[k] || []).length > 0 && (
                        <div key={k}><div className={styles.muted} style={{ fontSize: '.8rem', marginBottom: 4 }}>{label}</div>
                            {calc[k].map((x) => <div key={x.nome} className={styles.kv}><span>{x.nome}</span><strong>{x.qtd}</strong></div>)}</div>
                    )
                ))}
                {!(calc.tribunais || []).length && !(calc.tipos_documento || []).length && (
                    <Empty>Ainda sem dados suficientes. Acompanhe processos, confirme publicações e documentos.</Empty>
                )}
                <p className={styles.muted} style={{ fontSize: '.8rem' }}>Esses dados ficam só no seu escritório e não treinam modelos de terceiros.</p>
            </div>
        </div>
    );
}
