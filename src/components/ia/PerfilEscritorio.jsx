import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import { Banner, Button, Chip, Empty, Field, FilterBar, Input, Loading, Pill, Row, Select, Stack, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
import useAuth from '../../hooks/useAuth';
import useLoader from '../../hooks/useLoader';
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
    if (!data || !form) return <Loading />;
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
            <Stack as="form" className={styles.card} onSubmit={save}>
                <div className={`${styles.section_title} ${styles.mb_0}`}>Como o escritório se apresenta</div>
                <div className={styles.field}>Áreas de atuação
                    <Row role="group" aria-label="Áreas de atuação">
                        {data.opcoes_areas.map((a) => (
                            <Chip key={a.id} disabled={ro} active={form.areas.includes(a.id)} onClick={() => toggleArea(a.id)}>{a.label}</Chip>
                        ))}
                    </Row>
                </div>
                <Field label="Tom de comunicação">
                    <Select value={form.tom} disabled={ro} onChange={(e) => setForm({ ...form, tom: e.target.value })}>
                        {data.opcoes_tom.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </Select>
                </Field>
                <Field label="Público que o escritório atende">
                    <Input value={form.publico} disabled={ro} maxLength={200} placeholder="Ex.: trabalhadores da indústria e pequenas empresas"
                        onChange={(e) => setForm({ ...form, publico: e.target.value })} />
                </Field>
                <Field label="Cidade">
                    <Input value={form.cidade} disabled={ro} maxLength={80} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                </Field>
                <Field label="Assinatura padrão das minutas">
                    <Textarea value={form.assinatura} disabled={ro} maxLength={1000} placeholder={'Dra. Ana Lima\nOAB/PE 12.345'}
                        onChange={(e) => setForm({ ...form, assinatura: e.target.value })} />
                </Field>
                <FilterBar>
                    {['site', 'instagram', 'linkedin'].map((k) => (
                        <Field key={k} label={k === 'site' ? 'Site' : k[0].toUpperCase() + k.slice(1)}>
                            <Input value={form.redes[k] || ''} disabled={ro} onChange={(e) => setForm({ ...form, redes: { ...form.redes, [k]: e.target.value } })} />
                        </Field>
                    ))}
                </FilterBar>
                {ro ? <Banner tone="info">Só dono ou administrador altera o perfil.</Banner> : (
                    <Button type="submit" variant="primary" className={styles.w_fit} loading={busy} loadingLabel="Salvando…">Salvar perfil</Button>
                )}
            </Stack>
            <Stack className={styles.card}>
                <Row justify="between">
                    <div className={`${styles.section_title} ${styles.mb_0}`}>O que a IA percebeu nos seus dados</div>
                    <Button size="sm" onClick={() => brainApi.profile(true).then(() => reload())}>Recalcular</Button>
                </Row>
                {(calc.areas_sugeridas || []).length > 0 && (
                    <div><div className={`${styles.muted} ${styles.text_xs}`}>Áreas prováveis</div>
                        {calc.areas_sugeridas.map((a) => <Pill key={a} tone="blue">{data.opcoes_areas.find((o) => o.id === a)?.label || a}</Pill>)}</div>
                )}
                {[['tribunais', 'Tribunais mais frequentes'], ['classes', 'Classes processuais'], ['tipos_documento', 'Tipos de documento lidos']].map(([k, label]) => (
                    (calc[k] || []).length > 0 && (
                        <div key={k}><div className={`${styles.muted} ${styles.text_xs}`}>{label}</div>
                            {calc[k].map((x) => <div key={x.nome} className={styles.kv}><span>{x.nome}</span><strong>{x.qtd}</strong></div>)}</div>
                    )
                ))}
                {!(calc.tribunais || []).length && !(calc.tipos_documento || []).length && (
                    <Empty>Ainda sem dados suficientes. Acompanhe processos, confirme publicações e documentos.</Empty>
                )}
                <p className={`${styles.muted} ${styles.text_xs} ${styles.mb_0}`}>Esses dados ficam só no seu escritório e não treinam modelos de terceiros.</p>
            </Stack>
        </div>
    );
}
