import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiFolder, FiUploadCloud } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import { Banner, Button, Checkbox, Field, Input, Pill, Row, Segmented, Stack, StatCard, Table } from '../ui';
import { errorMessage } from '../../utils/format';
import { fmtBytes, folderProgress, foldersApi } from '../../services/imports';

const SOURCES = [{ id: 'drive', label: 'Google Drive', icon: FiFolder }, { id: 'zip', label: 'Arquivo .zip', icon: FiUploadCloud }];

// Carteira de clientes em pastas (CAD-234): cada pasta vira um cliente e os arquivos dentro dela, os documentos do cliente.
export default function PastasClientes() {
    const [params, setParams] = useSearchParams();
    const [state, setState] = useState(null);
    const [source, setSource] = useState('drive');
    const [link, setLink] = useState('');
    const [file, setFile] = useState(null);
    const [job, setJob] = useState(null);
    const [marked, setMarked] = useState(new Set());
    const [ia, setIa] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = () => foldersApi.state().then(setState).catch(() => setState({ drive: {} }));
    useEffect(() => { load(); }, []);
    useEffect(() => {                                     // volta do Google depois de autorizar a leitura do Drive
        const r = params.get('gcal');
        if (!r) return;
        if (r === 'ok') toast.success('Leitura do Drive autorizada. Cole o link da pasta.');
        else toast.error('O Google não autorizou a leitura do Drive.');
        params.delete('gcal');
        setParams(params, { replace: true });
    }, [params, setParams]);
    useEffect(() => {                                     // acompanha a importação em segundo plano
        if (job?.status !== 'running') return undefined;
        const t = setInterval(() => foldersApi.get(job.id).then((j) => {
            setJob(j);
            if (j.status === 'done') toast.success('Carteira importada.');
        }).catch(() => {}), 2000);
        return () => clearInterval(t);
    }, [job?.id, job?.status]);

    const run = async (fn) => {
        setBusy(true);
        setError('');
        try { await fn(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    const listed = (j) => { setJob(j); setMarked(new Set(j.previa.clientes.filter((c) => c.arquivos > 0).map((c) => c.indice))); };
    const list = () => run(async () => listed(source === 'drive' ? await foldersApi.fromDrive(link) : await foldersApi.fromZip(file)));
    const authorize = () => run(async () => { window.location.assign((await foldersApi.authorizeDrive()).authorization_url); });
    const start = () => run(async () => setJob(await foldersApi.run(job.id, [...marked], ia)));
    const reset = () => { setJob(null); setFile(null); load(); };
    const toggle = (i) => setMarked((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });

    const clientes = job?.previa?.clientes || [];
    const chosen = clientes.filter((c) => marked.has(c.indice));
    const drive = state?.drive || {};
    const needsAuth = source === 'drive' && drive.habilitado !== false && !drive.leitura_autorizada;

    if (job && job.status !== 'listed') {
        const p = job.progresso || {};
        return (
            <Stack gap={3} className={styles.card}>
                <div className={`${styles.section_title} ${styles.mb_0}`}>{job.status === 'running' ? 'Importando a carteira…' : job.status_label} — {job.nome}</div>
                {job.status === 'running' && (
                    <Stack gap={1}>
                        <div className={styles.bar} role="progressbar" aria-valuenow={folderProgress(p)} aria-valuemin={0} aria-valuemax={100}>
                            <div className={styles.bar_fill} style={{ width: `${folderProgress(p)}%` }} />
                        </div>
                        <span className={styles.muted}>{p.feitas || 0} de {p.total || 0} pastas</span>
                    </Stack>
                )}
                <div className={styles.grid}>
                    <StatCard title="Clientes novos" value={p.contatos_novos || 0} tone="green" />
                    <StatCard title="Já cadastrados" value={p.contatos_existentes || 0} />
                    <StatCard title="Documentos" value={p.documentos || 0} />
                    {p.repetidos > 0 && <StatCard title="Repetidos (pulados)" value={p.repetidos} />}
                </div>
                {p.erros?.length > 0 && <Banner tone="warn">{p.erros.length} arquivo(s) não entraram: {p.erros.slice(0, 5).join('; ')}{p.erros.length > 5 ? '…' : ''}</Banner>}
                {job.status !== 'running' && (
                    <Row>
                        <Button as={Link} variant="primary" to="/contatos">Ver contatos</Button>
                        <Button as={Link} to="/documents">Ver documentos</Button>
                        <Button onClick={reset}>Importar outra pasta</Button>
                    </Row>
                )}
            </Stack>
        );
    }

    if (job) {
        const files = chosen.reduce((s, c) => s + c.arquivos, 0);
        return (
            <Stack gap={3} className={styles.card}>
                <div className={`${styles.section_title} ${styles.mb_0}`}>Confira as pastas — {job.nome} (nada foi gravado ainda)</div>
                <div className={styles.grid}>
                    <StatCard title="Pastas de clientes" value={clientes.length} />
                    <StatCard title="Clientes novos" value={chosen.filter((c) => !c.contato_existente).length} tone="green" />
                    <StatCard title="Documentos" value={files} />
                </div>
                {(job.previa.total_ignorados > 0 || job.progresso?.soltos > 0) && (
                    <Banner tone="info">Ficam de fora: {job.previa.total_ignorados} arquivo(s) de tipo não aceito ou grande demais
                        {job.progresso?.soltos ? ` e ${job.progresso.soltos} arquivo(s) soltos fora das pastas de clientes` : ''}.</Banner>
                )}
                <Table columns={['', 'Cliente (nome da pasta)', 'CPF/CNPJ', 'Arquivos', 'No Cadrius']}>
                    {clientes.map((c) => (
                        <tr key={c.indice}>
                            <td><input type="checkbox" aria-label={`Importar ${c.nome}`} checked={marked.has(c.indice)} disabled={!c.arquivos} onChange={() => toggle(c.indice)} /></td>
                            <td data-label="Cliente"><strong>{c.nome}</strong>{c.nome !== c.pasta && <div className={styles.muted}>pasta: {c.pasta}</div>}
                                {c.exemplos.length > 0 && <div className={styles.muted}>{c.exemplos.join(' · ')}{c.arquivos > c.exemplos.length ? ' …' : ''}</div>}</td>
                            <td data-label="CPF/CNPJ">{c.documento || '—'}</td>
                            <td data-label="Arquivos">{c.arquivos}{c.tamanho ? ` (${fmtBytes(c.tamanho)})` : ''}{c.ignorados ? <div className={styles.muted}>{c.ignorados} fora</div> : null}</td>
                            <td data-label="No Cadrius">{c.contato_existente ? <Pill tone="blue">já é contato</Pill> : <Pill tone="green">novo</Pill>}</td>
                        </tr>
                    ))}
                </Table>
                <Checkbox checked={ia} onChange={(e) => setIa(e.target.checked)}>
                    Ler os documentos com a IA ao importar (extrai partes, datas e prazos; usa créditos por documento)
                </Checkbox>
                <Row>
                    <Button variant="primary" disabled={!chosen.length || busy} loading={busy} loadingLabel="Começando…" onClick={start}>
                        Importar {chosen.length} cliente(s) e {files} documento(s)
                    </Button>
                    <Button disabled={busy} onClick={() => run(async () => { await foldersApi.cancel(job.id); reset(); })}>Cancelar</Button>
                </Row>
            </Stack>
        );
    }

    return (
        <Stack gap={3} className={`${styles.card} ${styles.narrow}`}>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Carteira de clientes em pastas</div>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>
                Cada pasta vira um cliente e os arquivos dentro dela, os documentos dele. CPF/CNPJ no nome da pasta é aproveitado.
                Quem já é contato não é duplicado, e dá para importar de novo para trazer o que for novo.</p>
            {error && <Banner tone="error">{error}</Banner>}
            <Segmented options={SOURCES} value={source} onChange={setSource} aria-label="De onde vêm as pastas" />
            {source === 'drive' && (needsAuth ? (
                <Stack gap={2}>
                    <Banner tone="info">{drive.google_conectado ? 'Falta autorizar o Cadrius a ler as pastas do seu Google Drive.'
                        : 'Conecte o Google e autorize a leitura do Drive.'} O acesso é só de leitura e você pode revogar quando quiser.</Banner>
                    <Button variant="primary" className={styles.w_fit} loading={busy} loadingLabel="Abrindo o Google…" onClick={authorize}>Autorizar leitura do Drive</Button>
                </Stack>
            ) : (
                <Field label="Link da pasta-mãe dos clientes" hint="No Drive, abra a pasta que contém as pastas dos clientes e copie o link do navegador.">
                    <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://drive.google.com/drive/folders/…" />
                </Field>
            ))}
            {source === 'zip' && (
                <Field label="Arquivo .zip" hint={`No Drive: botão direito na pasta-mãe → Fazer download. Até ${state?.limite_zip_mb ? `${Math.round(state.limite_zip_mb / 1024)} GB` : '2 GB'}; pastas grandes vêm em partes (importe uma de cada vez).`}>
                    <Input type="file" accept=".zip" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </Field>
            )}
            {!(source === 'drive' && needsAuth) && (
                <Button variant="primary" className={styles.w_fit} disabled={source === 'drive' ? !link.trim() : !file} loading={busy}
                    loadingLabel={source === 'drive' ? 'Lendo as pastas…' : 'Enviando…'} onClick={list}>Ver as pastas</Button>
            )}
        </Stack>
    );
}
