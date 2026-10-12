import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiCopy, FiKey, FiLink, FiTrash2 } from 'react-icons/fi';
import styles from '../../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Field, FilterBar, Input, Loading, Modal, PageHeader, Pill, Row, Segmented, Select, Stack, Table } from '../../../components/ui';
import { errorMessage, fmtDateTime } from '../../../utils/format';
import { assistantApi, connectorSteps, pluginsApi } from '../../../services/assistant';

const APPS = [{ id: 'claude', label: 'Claude (Pro/Max/Team)' }, { id: 'chatgpt', label: 'ChatGPT' }, { id: 'code', label: 'Claude Code' }];

// Plugins (CAD-222): usar o Cadrius de dentro do Claude/ChatGPT (conector MCP) e a conta de IA do próprio escritório.
export default function Plugins() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const load = useCallback(() => pluginsApi.get().then(setData).catch((e) => setError(errorMessage(e))), []);
    useEffect(() => { load(); }, [load]);
    return (
        <div className={styles.page}>
            <PageHeader title="Plugins" subtitle="Cadrius dentro do Claude e do ChatGPT" />
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && (
                <>
                    <Connector data={data} reload={load} />
                    <OwnKeys data={data} reload={load} />
                </>
            )}
        </div>
    );
}

// Botão "Copiar" que vira "Copiado" por 1,5 s
function Copy({ value, label = 'Copiar' }) {
    const [ok, setOk] = useState(false);
    const copy = async () => {
        try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1500); } catch { toast.error('Não foi possível copiar.'); }
    };
    return <Button size="sm" icon={ok ? FiCheck : FiCopy} onClick={copy}>{ok ? 'Copiado' : label}</Button>;
}

// Token recém-criado: aparece uma única vez, por isso só o "Pronto" fecha (nem Esc nem clique fora)
function TokenCriado({ created, onClose }) {
    const [app, setApp] = useState('claude');
    return (
        <Modal title="Token criado — copie agora" size="lg" onClose={onClose} closeOnOverlay={false} closeOnEsc={false}
            footer={<Button variant="primary" onClick={onClose}>Pronto</Button>}>
            <Banner tone="warn">Ele não aparece de novo. Trate como senha: não envie por e-mail, chat ou GitHub. Se vazar, revogue.</Banner>
            <Segmented options={APPS} value={app} onChange={setApp} aria-label="Onde usar o conector" />
            <ol className={styles.ol_compact}>
                {connectorSteps(app, { url: created.url, urlWithToken: created.url_com_token, token: created.token }).map((step) => (
                    step.startsWith('http') || step.startsWith('claude mcp')
                        ? <li key={step} className={styles.li_plain}><Row wrap={false}><code className={`${styles.mono} ${styles.break_all} ${styles.flex_1}`}>{step}</code> <Copy value={step} /></Row></li>
                        : <li key={step}>{step}</li>
                ))}
            </ol>
        </Modal>
    );
}

function Connector({ data, reload }) {
    const c = data.conector;
    const [form, setForm] = useState({ nome: 'Claude', escopo: 'leitura' });
    const [created, setCreated] = useState(null);
    const toggle = async (on) => {
        try { await assistantApi.saveSettings({ conector_mcp: on }); toast.success(on ? 'Conector ligado.' : 'Conector desligado e tokens revogados.'); reload(); }
        catch (e) { toast.error(errorMessage(e)); }
    };
    const create = async (e) => {
        e.preventDefault();
        try { setCreated(await pluginsApi.createToken(form.nome, form.escopo)); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    const revoke = async (id) => {
        try { await pluginsApi.revokeToken(id); toast.success('Token revogado.'); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    return (
        <Stack as="section" className={styles.card} aria-labelledby="mcp-title">
            <Row gap={2} className={`${styles.section_title} ${styles.mb_0}`} id="mcp-title"><FiLink aria-hidden="true" /> Conector do Cadrius para Claude, ChatGPT e Claude Code</Row>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Para quem já usa o <strong>Claude Pro/Max/Team</strong> ou o ChatGPT: converse lá e consulte contatos, processos,
                publicações, prazos e finanças do Cadrius. Pedidos de ação (tarefa, minuta, mensagem) <strong>não executam</strong> por lá: viram
                um pedido que você confirma aqui, em Assistente IA.</p>
            {!c.ligado ? (
                <Banner tone="info">
                    O conector está desligado. Ao ligar, os dados que a pessoa consultar passam a ir para a conta de IA dela (Claude/ChatGPT),
                    sob o contrato que ela tem com esse fornecedor (LGPD).
                    {data.pode_configurar && <Row className={styles.mt_2}>
                        <Button variant="primary" onClick={() => toggle(true)}>Ligar conector para o escritório</Button>
                    </Row>}
                </Banner>
            ) : (
                <>
                    <FilterBar as="form" onSubmit={create}>
                        <Field label="Nome do token"><Input value={form.nome} maxLength={80} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
                        <Field label="Permissão">
                            <Select value={form.escopo} onChange={(e) => setForm({ ...form, escopo: e.target.value })}>
                                <option value="leitura">Só consultar</option><option value="pedidos">Consultar e preparar pedidos</option>
                            </Select>
                        </Field>
                        <Button type="submit" variant="primary" icon={FiKey}>Gerar token</Button>
                    </FilterBar>
                    {c.tokens.length > 0 && (
                        <Table columns={['Token', 'Permissão', 'Uso', 'Vence', { label: '', className: styles.td_actions }]}>
                            {c.tokens.map((t) => (
                                <tr key={t.id}>
                                    <td><strong>{t.nome}</strong><div className={styles.mono}>{t.prefixo}…</div></td>
                                    <td data-label="Permissão">{t.escopo === 'pedidos' ? 'Consulta e pedidos' : 'Só consulta'}</td>
                                    <td data-label="Uso">{t.usos} · {t.ultimo_uso ? fmtDateTime(t.ultimo_uso) : 'nunca usado'}</td>
                                    <td data-label="Vence">{t.ativo ? fmtDateTime(t.expira_em) : <Pill tone="gray">Revogado</Pill>}</td>
                                    <td className={styles.td_actions}>{t.ativo && <Button size="sm" variant="danger" onClick={() => revoke(t.id)}>Revogar</Button>}</td>
                                </tr>
                            ))}
                        </Table>
                    )}
                    {data.pode_configurar && <button type="button" className={`${styles.link_btn} ${styles.w_fit}`} onClick={() => toggle(false)}>Desligar o conector do escritório (revoga todos os tokens)</button>}
                </>
            )}
            {created && <TokenCriado created={created} onClose={() => setCreated(null)} />}
        </Stack>
    );
}

function OwnKeys({ data, reload }) {
    const [form, setForm] = useState({ provedor: 'ANTHROPIC', chave: '', modelo: '', endereco: '', conta_paga: true });
    const [busy, setBusy] = useState(false);
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { await pluginsApi.saveKey(form); setForm({ ...form, chave: '' }); toast.success('Chave salva (cifrada).'); reload(); }
        catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const test = async (p) => {
        try { const r = await pluginsApi.testKey(p); toast.success(`Funcionou (${r.modelo}).`); } catch (e) { toast.error(errorMessage(e)); }
    };
    const remove = async (p) => {
        try { await pluginsApi.removeKey(p); toast.success('Chave removida.'); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    const selected = data.provedores.find((p) => p.chave === form.provedor);
    return (
        <Stack as="section" className={styles.card} aria-labelledby="byok-title">
            <Row gap={2} className={`${styles.section_title} ${styles.mb_0}`} id="byok-title"><FiKey aria-hidden="true" /> Conta de IA do escritório (traga sua chave)</Row>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>O assistente e as ferramentas de texto passam a usar a sua conta (Claude, OpenAI, Gemini…) e <strong>não
                consomem créditos do Cadrius</strong>. Importante: a assinatura <strong>Claude Pro</strong> do claude.ai não inclui API — para isto crie
                uma chave em console.anthropic.com (cobrança por uso). Para usar o Pro, use o conector acima.</p>
            {data.chaves.length === 0 ? <div className={styles.muted}>Nenhuma chave cadastrada: o Cadrius usa as IAs configuradas pela plataforma.</div> : (
                data.chaves.map((k) => (
                    <div key={k.provedor} className={styles.list_row}>
                        <span className={styles.flex_1}><strong>{k.nome}</strong> · final …{k.final} · modelo {k.modelo}
                            {!k.conta_paga && <> · <Pill tone="yellow">Gratuita: só sem dados de clientes</Pill></>}
                            <br /><span className={styles.muted}>{k.ultimo_uso ? `Último uso ${fmtDateTime(k.ultimo_uso)}` : 'Ainda não usada'}</span></span>
                        {data.pode_configurar && <Row gap={1} wrap={false}>
                            <Button size="sm" onClick={() => test(k.provedor)}>Testar</Button>
                            <Button size="sm" variant="danger" icon={FiTrash2} aria-label={`Remover ${k.nome}`} onClick={() => remove(k.provedor)} />
                        </Row>}
                    </div>
                ))
            )}
            {data.pode_configurar ? (
                <Stack as="form" gap={3} onSubmit={save} autoComplete="off">
                    <FilterBar>
                        <Field label="Provedor">
                            <Select value={form.provedor} onChange={(e) => setForm({ ...form, provedor: e.target.value })}>
                                {data.provedores.map((p) => <option key={p.chave} value={p.chave}>{p.nome}</option>)}
                            </Select>
                        </Field>
                        {form.provedor === 'OLLAMA' ? (
                            <Field label="Endereço HTTPS do seu servidor">
                                <Input value={form.endereco} placeholder="https://ia.seuescritorio.com.br/v1" onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
                            </Field>
                        ) : (
                            <Field label="Chave de API">
                                <Input type="password" value={form.chave} onChange={(e) => setForm({ ...form, chave: e.target.value })} />
                            </Field>
                        )}
                        <Field label="Modelo (opcional)">
                            <Input value={form.modelo} placeholder="padrão do provedor" onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
                        </Field>
                    </FilterBar>
                    {selected?.treina_no_gratis && (
                        <Checkbox checked={form.conta_paga} onChange={(e) => setForm({ ...form, conta_paga: e.target.checked })}>
                            Minha conta é paga (no plano gratuito este provedor usa os dados para treinar e o Cadrius não envia dados de clientes)
                        </Checkbox>
                    )}
                    <Row>
                        <Button type="submit" variant="primary" loading={busy} loadingLabel="Salvando…">Salvar chave</Button>
                        {selected && <a href={selected.site} target="_blank" rel="noreferrer" className={styles.muted}>Onde gerar / preços</a>}
                    </Row>
                </Stack>
            ) : <div className={styles.muted}>Só dono ou administrador cadastra a conta de IA do escritório.</div>}
        </Stack>
    );
}
