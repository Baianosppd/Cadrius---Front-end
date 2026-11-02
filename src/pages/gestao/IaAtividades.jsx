import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiArrowDown, FiArrowUp, FiX } from 'react-icons/fi';
import styles from '../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Field, FormModal, Loading, PageHeader, Pill, Row, Select, Stack, Table } from '../../components/ui';
import { errorMessage, fmtDateTime } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
import api from '../../services/api';

const iaApi = {
    get: () => api.get('backoffice/ia/rotas/').then((r) => r.data),
    save: (act, body) => api.patch(`backoffice/ia/rotas/${act}/`, body).then((r) => r.data),
    reset: (act) => api.delete(`backoffice/ia/rotas/${act}/`).then((r) => r.data),
};

// Gestão → IA por atividade (CAD-224): qual IA atende cada tipo de trabalho, com reservas automáticas
export default function IaAtividades() {
    const { data, error, reload } = useLoader(iaApi.get, []);
    const [editing, setEditing] = useState(null);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const name = Object.fromEntries(data.provedores.map((p) => [p.chave, p.nome]));
    const save = async (act, cadeia, usar_reservas) => {
        await iaApi.save(act, { cadeia, usar_reservas });
        toast.success('Cadeia salva.');
        setEditing(null);
        reload();
    };
    const reset = async (act) => {
        try { await iaApi.reset(act); toast.success('Voltou à recomendação.'); setEditing(null); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    return (
        <div className={styles.page}>
            <PageHeader title="IA por atividade" subtitle="A melhor IA para cada trabalho" />
            <Banner tone="info"><ul className={styles.list_indent}>{data.regras.map((r) => <li key={r}>{r}</li>)}</ul></Banner>
            <div className={styles.card_grid}>
                {data.atividades.map((a) => (
                    <Stack key={a.atividade} gap={2} className={styles.card}>
                        <Row justify="between">
                            <strong>{a.rotulo}</strong>
                            {a.personalizado ? <Pill tone="yellow">personalizada</Pill> : <Pill tone="green">recomendada</Pill>}
                        </Row>
                        <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>{a.onde}</p>
                        <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}><em>{a.por_que}</em></p>
                        <div className={styles.list_row}><span>Atende agora</span>
                            <strong>{a.atende_agora ? name[a.atende_agora] : <span className={styles.text_danger}>nenhuma IA configurada</span>}</strong></div>
                        <ol className={`${styles.ol_compact} ${styles.muted}`}>
                            {a.cadeia.map((p) => <li key={p}>{name[p] || p}{a.ordem_efetiva.includes(p) ? '' : ' — sem chave/indisponível'}</li>)}
                        </ol>
                        <div className={styles.muted}>{a.usar_reservas ? 'Depois da cadeia: demais IAs configuradas como reserva.' : 'Só a cadeia acima (sem reservas).'}</div>
                        <Row gap={1}>
                            <Button size="sm" onClick={() => setEditing(a)}>Alterar ordem</Button>
                            {a.personalizado && <Button size="sm" variant="ghost" onClick={() => reset(a.atividade)}>Usar a recomendada</Button>}
                        </Row>
                    </Stack>
                ))}
            </div>
            <Table columns={['Provedor', 'Chave', 'Modelo', 'Saúde', 'Observação']}>
                {data.provedores.map((p) => (
                    <tr key={p.chave}>
                        <td><strong>{p.nome}</strong></td>
                        <td data-label="Chave">{p.configurado ? <Pill tone="green">configurado</Pill> : <Pill tone="gray">sem chave</Pill>}</td>
                        <td data-label="Modelo">{p.modelo}</td>
                        <td data-label="Saúde">{p.saude.fora_do_ar ? <Pill tone="red">fora (reserva assume)</Pill> : p.saude.falhas ? <Pill tone="yellow">{p.saude.falhas} falha(s)</Pill> : <Pill tone="green">ok</Pill>}
                            {p.saude.ultimo_sucesso && <div className={styles.muted}>último ok {fmtDateTime(p.saude.ultimo_sucesso)}</div>}</td>
                        <td data-label="Observação" className={styles.muted}>{p.treina_com_dados ? 'Plano gratuito treina com os dados: nunca recebe dado de cliente.' : p.local ? 'Roda no servidor.' : ''}</td>
                    </tr>
                ))}
            </Table>
            {editing && <Editor a={editing} providers={data.provedores} onClose={() => setEditing(null)} onSave={save} />}
        </div>
    );
}

function Editor({ a, providers, onClose, onSave }) {
    const [chain, setChain] = useState(a.cadeia);
    const [reserves, setReserves] = useState(a.usar_reservas);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const move = (i, d) => { const c = [...chain]; [c[i], c[i + d]] = [c[i + d], c[i]]; setChain(c); };
    const name = Object.fromEntries(providers.map((p) => [p.chave, p.nome]));
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try { await onSave(a.atividade, chain, reserves); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <FormModal title={a.rotulo} onClose={onClose} onSubmit={submit} busy={busy} error={error}>
            <p className={`${styles.muted} ${styles.mt_0}`}>A 1ª da lista atende; se falhar, a próxima assume. Recomendado: {a.recomendado.map((p) => name[p] || p).join(' > ')}.</p>
            <div>
                {chain.map((p, i) => (
                    <div key={p} className={styles.list_row}>
                        <span>{i + 1}. {name[p] || p}</span>
                        <Row gap={1} wrap={false}>
                            <Button size="sm" icon={FiArrowUp} disabled={i === 0} aria-label={`Subir ${name[p]}`} onClick={() => move(i, -1)} />
                            <Button size="sm" icon={FiArrowDown} disabled={i === chain.length - 1} aria-label={`Descer ${name[p]}`} onClick={() => move(i, 1)} />
                            <Button size="sm" variant="ghost" icon={FiX} disabled={chain.length === 1} aria-label={`Tirar ${name[p]}`} onClick={() => setChain(chain.filter((x) => x !== p))} />
                        </Row>
                    </div>
                ))}
            </div>
            <Field label="Adicionar à cadeia">
                <Select value="" onChange={(e) => e.target.value && setChain([...chain, e.target.value])}>
                    <option value="">Escolha…</option>
                    {providers.filter((p) => !chain.includes(p.chave)).map((p) => <option key={p.chave} value={p.chave}>{p.nome}{p.configurado ? '' : ' (sem chave)'}</option>)}
                </Select>
            </Field>
            <Checkbox checked={reserves} onChange={(e) => setReserves(e.target.checked)}>Se toda a cadeia falhar, usar as demais IAs configuradas como reserva</Checkbox>
        </FormModal>
    );
}
