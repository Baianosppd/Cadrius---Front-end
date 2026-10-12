import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCopy, FiTrash2 } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import { Banner, Button, Checkbox, Chip, Empty, Field, Input, Loading, Pill, Row, Stack, StatCard, Table, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
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
        <Stack>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Cada envio vira contato e oportunidade no funil, com o consentimento do visitante.</p>
            {canWrite && (
                <Stack as="form" className={styles.card} onSubmit={create}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Novo formulário</div>
                    <div className={styles.grid}>
                        <Field label="Título"><Input required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></Field>
                        <Field label="Assuntos (separados por vírgula)"><Input value={f.assuntos} onChange={(e) => setF({ ...f, assuntos: e.target.value })} placeholder="Previdenciário, Família, Trabalhista" /></Field>
                    </div>
                    <Field label="Apresentação (opcional)"><Textarea value={f.apresentacao} maxLength={500} onChange={(e) => setF({ ...f, apresentacao: e.target.value })} /></Field>
                    {alerts && <Banner tone="warn">{alerts}</Banner>}
                    {alerts.includes('OAB') && (
                        <Checkbox checked={f.revisado} onChange={(e) => setF({ ...f, revisado: e.target.checked })}>Revisei o texto e assumo a responsabilidade</Checkbox>
                    )}
                    <Button type="submit" variant="primary" className={styles.w_fit}>Criar formulário</Button>
                </Stack>
            )}
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && data.length === 0 && <Empty title="Nenhum formulário ainda">Crie um e coloque o link no site, no Google ou na bio do Instagram.</Empty>}
            {data && data.length > 0 && (
                <Table columns={['Formulário', 'Envios', 'Situação', 'Link público', { label: '', className: styles.td_actions }]}>
                    {data.map((form) => (
                        <tr key={form.id}>
                            <td><strong>{form.titulo}</strong>{form.alertas?.length > 0 && <div className={styles.muted}>{form.alertas.length} alerta(s) da checagem OAB</div>}</td>
                            <td data-label="Envios">{form.envios}</td>
                            <td data-label="Situação"><Pill tone={form.ativo ? 'green' : 'gray'}>{form.ativo ? 'Ativo' : 'Pausado'}</Pill></td>
                            <td data-label="Link público">
                                <Row gap={1}>
                                    <Button as="a" size="sm" href={form.link} target="_blank" rel="noreferrer noopener">Abrir</Button>
                                    <Button size="sm" icon={FiCopy} onClick={() => navigator.clipboard.writeText(publicUrl(form.link)).then(() => toast.success('Link copiado.'))}>Copiar</Button>
                                </Row>
                            </td>
                            <td className={styles.td_actions}>{canWrite && (
                                <Row gap={1} wrap={false}>
                                    <Button size="sm" onClick={() => toggle(form)}>{form.ativo ? 'Pausar' : 'Ativar'}</Button>
                                    <Button size="sm" variant="danger" icon={FiTrash2} aria-label={`Apagar ${form.titulo}`} onClick={() => remove(form)} />
                                </Row>
                            )}</td>
                        </tr>
                    ))}
                </Table>
            )}
        </Stack>
    );
}

function ResultTable({ rows, title }) {
    return (
        <Table columns={[title, 'Oportunidades', 'Fechadas', 'Não fecharam', 'Conversão', 'Honorários fechados']}
            empty={rows.length === 0 && <Empty>Sem oportunidades no período.</Empty>}>
            {rows.map((r) => (
                <tr key={r.chave}><td><strong>{r.rotulo}</strong></td><td data-label="Oportunidades">{r.oportunidades}</td><td data-label="Fechadas">{r.ganhas}</td>
                    <td data-label="Não fecharam">{r.perdidas}</td><td data-label="Conversão">{r.conversao_pct == null ? '—' : `${r.conversao_pct}%`}</td>
                    <td data-label="Honorários">{brl(r.valor_ganho_centavos)}</td></tr>
            ))}
        </Table>
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
        <Stack>
            <Row role="group" aria-label="Período">
                {[90, 180, 365].map((n) => <Chip key={n} active={dias === n} onClick={() => setDias(n)}>Últimos {n} dias</Chip>)}
            </Row>
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
        </Stack>
    );
}
