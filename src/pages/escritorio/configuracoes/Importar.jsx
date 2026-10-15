import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../../components/ui/ui.module.css';
import { Banner, Button, Empty, Field, Input, PageHeader, Pill, Row, Segmented, Select, Stack, StatCard, Table } from '../../../components/ui';
import PastasClientes from '../../../components/importar/PastasClientes';
import { errorMessage, fmtDateTime } from '../../../utils/format';
import useLoader from '../../../hooks/useLoader';
import { ACTION_TONE, MAX_MB, TARGETS, importsApi, missingRequired, setColumnField } from '../../../services/imports';

// Importações anteriores (só aparece quando há alguma)
function Historico({ tick }) {
    const { data } = useLoader(importsApi.list, [tick]);
    if (!data?.length) return null;
    return (
        <Stack gap={3}>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Importações anteriores</div>
            <Table columns={['Quando', 'Arquivo', 'Destino', 'Situação', 'Resultado']}>
                {data.map((j) => (
                    <tr key={j.id}><td>{fmtDateTime(j.created_at)}</td><td data-label="Arquivo">{j.filename}</td><td data-label="Destino">{j.target_label}</td>
                        <td data-label="Situação">{j.status_label}</td>
                        <td data-label="Resultado">{j.status === 'done' ? `${j.summary.created} criados · ${j.summary.updated} atualizados · ${j.summary.errors} com erro` : '—'}</td></tr>
                ))}
            </Table>
        </Stack>
    );
}

const MODES = [{ id: 'planilha', label: 'Planilha' }, { id: 'pastas', label: 'Pastas de clientes (Drive)' }];

export default function Importar() {
    const [params] = useSearchParams();
    const [mode, setMode] = useState(params.get('gcal') || params.get('tipo') === 'pastas' ? 'pastas' : 'planilha');
    const [target, setTarget] = useState('contacts');
    const [file, setFile] = useState(null);
    const [job, setJob] = useState(null);
    const [mapping, setMapping] = useState({});
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [tick, setTick] = useState(0);

    const run = async (fn) => {
        setBusy(true);
        setError('');
        try { await fn(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    const reset = () => { setJob(null); setPreview(null); setResult(null); setFile(null); setMapping({}); setTick((t) => t + 1); };
    const upload = () => run(async () => {
        if (!file) throw new Error('Escolha um arquivo.');
        const j = await importsApi.upload(file, target);
        setJob(j);
        setMapping(j.mapping);
    });
    const simulate = () => run(async () => { setPreview(await importsApi.preview(job.id, mapping)); });
    const commit = () => run(async () => {
        const done = await importsApi.commit(job.id);
        setResult(done);
        toast.success('Importação concluída.');
        setTick((t) => t + 1);
    });
    const missing = job ? missingRequired(job.fields, mapping) : [];
    const valid = preview ? preview.counts.create + preview.counts.update : 0;

    return (
        <div className={styles.page}>
            <PageHeader title="Importar dados" subtitle="Planilhas ou pastas de clientes do Google Drive" />
            <Segmented options={MODES} value={mode} onChange={setMode} aria-label="O que importar" />
            {mode === 'pastas' ? <PastasClientes /> : (<>
            {error && <Banner tone="error">{error}</Banner>}

            {!job && (
                <Stack gap={3} className={`${styles.card} ${styles.narrow}`}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>1. Escolha o arquivo</div>
                    <Field label="O que você vai importar">
                        <Select value={target} onChange={(e) => setTarget(e.target.value)}>{TARGETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
                    </Field>
                    <Field label="Planilha" hint={`.csv ou .xlsx, até ${MAX_MB} MB e 5.000 linhas; a 1ª linha com os nomes das colunas.`}>
                        <Input type="file" accept=".csv,.xlsx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </Field>
                    <Button variant="primary" className={styles.w_fit} disabled={!file} loading={busy} loadingLabel="Lendo…" onClick={upload}>Ler planilha</Button>
                </Stack>
            )}

            {job && !result && (
                <Stack gap={3} className={styles.card}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>2. Confira as colunas — {job.filename} ({job.rows_total} linhas)</div>
                    <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Sugerimos o campo de cada coluna pelo nome dela. Ajuste o que precisar; colunas sem campo são ignoradas.</p>
                    <Table columns={['Coluna da planilha', 'Exemplo', 'Vai para']}>
                        {job.columns.map((col, i) => (
                            <tr key={i}><td><strong>{col}</strong></td><td data-label="Exemplo" className={styles.muted}>{job.sample?.[0]?.[i] || '—'}</td>
                                <td data-label="Vai para">
                                    <Select aria-label={`Campo da coluna ${col}`} value={mapping[String(i)] || ''}
                                        onChange={(e) => { setMapping((m) => setColumnField(m, i, e.target.value)); setPreview(null); }}>
                                        <option value="">— ignorar —</option>
                                        {job.fields.map((f) => <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>)}
                                    </Select>
                                </td></tr>
                        ))}
                    </Table>
                    {missing.length > 0 && <Banner tone="warn">Falta escolher a coluna de: {missing.join(', ')}.</Banner>}
                    <Row>
                        <Button variant="primary" disabled={missing.length > 0 || busy} loading={busy && !preview} loadingLabel="Simulando…" onClick={simulate}>3. Simular</Button>
                        <Button disabled={busy} onClick={() => run(async () => { await importsApi.cancel(job.id); reset(); })}>Cancelar</Button>
                    </Row>
                </Stack>
            )}

            {preview && !result && (
                <Stack gap={3} className={styles.card}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Simulação (nada foi gravado)</div>
                    <div className={styles.grid}>
                        <StatCard title="Serão criados" value={preview.counts.create} tone="green" />
                        <StatCard title="Serão atualizados" value={preview.counts.update} />
                        <StatCard title="Com erro (ficam de fora)" value={preview.counts.errors} tone={preview.counts.errors ? 'red' : undefined} />
                    </div>
                    <Table columns={['Linha', 'O que acontece', 'Detalhe']}>
                        {preview.preview.map((r) => (
                            <tr key={r.row}><td>{r.row}</td><td data-label="O que acontece"><Pill tone={ACTION_TONE[r.action]}>{r.action}</Pill></td>
                                <td data-label="Detalhe">{r.errors.length ? r.errors.join(' ') : (r.values.name || r.values.cnj || '')}</td></tr>
                        ))}
                    </Table>
                    {valid > 0
                        ? <Button variant="primary" className={styles.w_fit} loading={busy} loadingLabel="Importando…" onClick={commit}>4. Importar {valid} linhas</Button>
                        : <Banner tone="warn">Nenhuma linha válida para importar. Corrija a planilha e envie de novo.</Banner>}
                </Stack>
            )}

            {result && (
                <Stack gap={3} className={styles.card}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Importação concluída</div>
                    <p className={`${styles.mt_0} ${styles.mb_0}`}>{result.summary.created} criados · {result.summary.updated} atualizados · {result.summary.skipped} sem mudança · {result.summary.errors} com erro.</p>
                    {result.errors.length > 0 && <Banner tone="warn">Linhas com erro: {result.errors.map((e) => `${e.row} (${e.errors.join(' ')})`).join('; ')}</Banner>}
                    <Row>
                        <Button as={Link} variant="primary" to={result.target === 'contacts' ? '/contatos' : '/acompanhamento'}>Ver {result.target === 'contacts' ? 'contatos' : 'processos'}</Button>
                        <Button onClick={reset}>Importar outra planilha</Button>
                    </Row>
                </Stack>
            )}
            <Historico tick={tick} />
            {!job && <Empty>Dica: exporte a planilha do seu sistema antigo ou do Excel como CSV (UTF-8) ou .xlsx.</Empty>}
            </>)}
        </div>
    );
}
