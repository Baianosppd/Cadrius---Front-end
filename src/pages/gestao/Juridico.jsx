import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiTrash2 } from 'react-icons/fi';
import styles from '../../components/ui/ui.module.css';
import { Banner, Button, Empty, Field, FilterBar, Input, PageHeader, Pill, Select, Stack, Table } from '../../components/ui';
import { errorMessage, fmtDate } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
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
            <PageHeader title="Jurídico" subtitle="Suspensões de prazo dos tribunais" />
            <Banner tone="info">Cadastre só com o <strong>link do ato oficial</strong> (portaria, certidão ou aviso do tribunal). A suspensão entra na contagem de
                prazos de todos os escritórios e avisa, pelo gatilho "Suspensão de prazos no tribunal", quem tem processo ali. Suspensão só de uma comarca
                aparece como aviso, mas não entra na contagem automática.</Banner>
            <Stack as="form" gap={3} className={styles.card} onSubmit={save}>
                <div className={`${styles.section_title} ${styles.mb_0}`}>Nova suspensão / indisponibilidade</div>
                <FilterBar>
                    <Field label="Tribunal" hint="Sigla; vazio = nacional"><Input value={f.tribunal} onChange={sf('tribunal')} placeholder="tjsp" /></Field>
                    <Field label="Comarca (opcional)"><Input value={f.comarca} onChange={sf('comarca')} /></Field>
                    <Field label="Tipo"><Select value={f.tipo} onChange={sf('tipo')}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
                </FilterBar>
                <FilterBar>
                    <Field label="Início"><Input type="date" required value={f.inicio} onChange={sf('inicio')} /></Field>
                    <Field label="Fim" hint="Vazio = um dia só"><Input type="date" value={f.fim} onChange={sf('fim')} /></Field>
                    <Field label="Motivo" className={styles.flex_2}><Input required value={f.motivo} onChange={sf('motivo')} placeholder="Portaria 603/2026 — migração do sistema" /></Field>
                </FilterBar>
                <Field label="Link do ato oficial" hint="Começa com https://"><Input required type="url" value={f.fonte} onChange={sf('fonte')} /></Field>
                <Button type="submit" variant="primary" className={styles.w_fit}>Cadastrar e avisar escritórios</Button>
            </Stack>
            {error && <Banner tone="error">{error}</Banner>}
            {data && (
                <Table columns={['Tribunal', 'Período', 'Tipo', 'Motivo', { label: '', className: styles.td_actions }]}
                    empty={data.length === 0 && <Empty>Nenhuma suspensão cadastrada.</Empty>}>
                    {data.map((s) => (
                        <tr key={s.id}>
                            <td><Pill>{s.tribunal}</Pill>{s.comarca && <div className={styles.muted}>{s.comarca}</div>}</td>
                            <td data-label="Período">{fmtDate(s.inicio)} a {fmtDate(s.fim)}</td>
                            <td data-label="Tipo">{s.tipo_label}</td>
                            <td data-label="Motivo">{s.motivo} <a href={s.fonte} target="_blank" rel="noreferrer noopener">ato</a></td>
                            <td className={styles.td_actions}><Button size="sm" variant="danger" icon={FiTrash2} aria-label="Apagar suspensão" onClick={() => remove(s)} /></td>
                        </tr>
                    ))}
                </Table>
            )}
            <Stack as="form" gap={3} className={styles.card} onSubmit={saveCourt}>
                <div className={`${styles.section_title} ${styles.mb_0}`}>Serviços de um tribunal (Balcão Virtual, custas, pauta)</div>
                <FilterBar>
                    <Field label="Sigla"><Input required value={c.tribunal} onChange={sc('tribunal')} placeholder="tjsp" /></Field>
                    <Field label="Nome" className={styles.flex_2}><Input required value={c.nome} onChange={sc('nome')} /></Field>
                    <Field label="Horário"><Input value={c.horario} onChange={sc('horario')} placeholder="12h às 18h" /></Field>
                </FilterBar>
                <FilterBar>
                    <Field label="Balcão Virtual"><Input type="url" value={c.balcao_virtual} onChange={sc('balcao_virtual')} /></Field>
                    <Field label="Serviços / custas"><Input type="url" value={c.servicos} onChange={sc('servicos')} /></Field>
                    <Field label="Pauta"><Input type="url" value={c.pauta} onChange={sc('pauta')} /></Field>
                </FilterBar>
                <Field label="Observações"><Input value={c.observacoes} onChange={sc('observacoes')} /></Field>
                <Button type="submit" className={styles.w_fit}>Salvar tribunal</Button>
                {courts.data && courts.data.length > 0 && <p className={`${styles.muted} ${styles.mb_0}`}>Cadastrados: {courts.data.map((x) => x.sigla).join(', ')}.</p>}
            </Stack>
        </div>
    );
}
