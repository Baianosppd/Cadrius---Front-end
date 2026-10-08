import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiCopy, FiKey, FiLink, FiTrash2 } from 'react-icons/fi';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import { assistantApi, connectorSteps, pluginsApi } from '../../services/assistant';

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
            {!data && !error && <Empty>Carregando…</Empty>}
            {data && (
                <>
                    <Connector data={data} reload={load} />
                    <OwnKeys data={data} reload={load} />
                </>
            )}
        </div>
    );
}

function Copy({ value, label = 'Copiar' }) {
    const [ok, setOk] = useState(false);
    return (
        <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={async () => {
            try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1500); } catch { toast.error('Não foi possível copiar.'); }
        }}>{ok ? <><FiCheck aria-hidden="true" /> Copiado</> : <><FiCopy aria-hidden="true" /> {label}</>}</button>
    );
}

function Connector({ data, reload }) {
    const c = data.conector;
    const [form, setForm] = useState({ nome: 'Claude', escopo: 'leitura' });
    const [created, setCreated] = useState(null);
    const [app, setApp] = useState('claude');
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
        <section className={`${styles.card} ${styles.stack}`} aria-labelledby="mcp-title">
            <div className={styles.section_title} id="mcp-title"><FiLink aria-hidden="true" /> Conector do Cadrius para Claude, ChatGPT e Claude Code</div>
            <p className={styles.muted}>Para quem já usa o <strong>Claude Pro/Max/Team</strong> ou o ChatGPT: converse lá e consulte contatos, processos,
                publicações, prazos e finanças do Cadrius. Pedidos de ação (tarefa, minuta, mensagem) <strong>não executam</strong> por lá: viram
                um pedido que você confirma aqui, em Assistente IA.</p>
            {!c.ligado ? (
                <Banner tone="info">
                    O conector está desligado. Ao ligar, os dados que a pessoa consultar passam a ir para a conta de IA dela (Claude/ChatGPT),
                    sob o contrato que ela tem com esse fornecedor (LGPD).
                    {data.pode_configurar && <div className={styles.btn_row} style={{ marginTop: 8 }}>
                        <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => toggle(true)}>Ligar conector para o escritório</button>
                    </div>}
                </Banner>
            ) : (
                <>
                    <form className={styles.filters} onSubmit={create}>
                        <label className={styles.field}>Nome do token
                            <input className={styles.input} value={form.nome} maxLength={80} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                        </label>
                        <label className={styles.field}>Permissão
                            <select className={styles.select} value={form.escopo} onChange={(e) => setForm({ ...form, escopo: e.target.value })}>
                                <option value="leitura">Só consultar</option><option value="pedidos">Consultar e preparar pedidos</option>
                            </select>
                        </label>
                        <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} style={{ alignSelf: 'end' }}><FiKey aria-hidden="true" /> Gerar token</button>
                    </form>
                    {c.tokens.length > 0 && (
                        <div className={styles.table_wrap}><table className={styles.table}>
                            <thead><tr><th>Token</th><th>Permissão</th><th>Uso</th><th>Vence</th><th /></tr></thead>
                            <tbody>{c.tokens.map((t) => (
                                <tr key={t.id}>
                                    <td><strong>{t.nome}</strong><div className={styles.mono}>{t.prefixo}…</div></td>
                                    <td>{t.escopo === 'pedidos' ? 'Consulta e pedidos' : 'Só consulta'}</td>
                                    <td>{t.usos} · {t.ultimo_uso ? fmtDateTime(t.ultimo_uso) : 'nunca usado'}</td>
                                    <td>{t.ativo ? fmtDateTime(t.expira_em) : <Pill tone="gray">Revogado</Pill>}</td>
                                    <td>{t.ativo && <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => revoke(t.id)}>Revogar</button>}</td>
                                </tr>
                            ))}</tbody>
                        </table></div>
                    )}
                    {data.pode_configurar && <button type="button" className={`${styles.link_btn}`} onClick={() => toggle(false)}>Desligar o conector do escritório (revoga todos os tokens)</button>}
                </>
            )}
            {created && (
                <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="tok-title">
                    <div className={styles.modal} style={{ maxWidth: 720, width: '100%' }}>
                        <div className={styles.modal_title} id="tok-title">Token criado — copie agora</div>
                        <Banner tone="warn">Ele não aparece de novo. Trate como senha: não envie por e-mail, chat ou GitHub. Se vazar, revogue.</Banner>
                        <div className={styles.segmented} role="tablist">
                            {[['claude', 'Claude (Pro/Max/Team)'], ['chatgpt', 'ChatGPT'], ['code', 'Claude Code']].map(([k, l]) => (
                                <button key={k} type="button" role="tab" aria-selected={app === k} className={`${styles.chip} ${app === k ? styles.chip_active : ''}`} onClick={() => setApp(k)}>{l}</button>
                            ))}
                        </div>
                        <ol style={{ paddingLeft: 18, display: 'grid', gap: 8 }}>
                            {connectorSteps(app, { url: created.url, urlWithToken: created.url_com_token, token: created.token }).map((step) => (
                                step.startsWith('http') || step.startsWith('claude mcp')
                                    ? <li key={step} style={{ listStyle: 'none' }}><code className={styles.mono} style={{ wordBreak: 'break-all' }}>{step}</code> <Copy value={step} /></li>
                                    : <li key={step}>{step}</li>
                            ))}
                        </ol>
                        <div className={styles.btn_row}><button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setCreated(null)}>Pronto</button></div>
                    </div>
                </div>
            )}
        </section>
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
        <section className={`${styles.card} ${styles.stack}`} aria-labelledby="byok-title">
            <div className={styles.section_title} id="byok-title"><FiKey aria-hidden="true" /> Conta de IA do escritório (traga sua chave)</div>
            <p className={styles.muted}>O assistente e as ferramentas de texto passam a usar a sua conta (Claude, OpenAI, Gemini…) e <strong>não
                consomem créditos do Cadrius</strong>. Importante: a assinatura <strong>Claude Pro</strong> do claude.ai não inclui API — para isto crie
                uma chave em console.anthropic.com (cobrança por uso). Para usar o Pro, use o conector acima.</p>
            {data.chaves.length === 0 ? <div className={styles.muted}>Nenhuma chave cadastrada: o Cadrius usa as IAs configuradas pela plataforma.</div> : (
                data.chaves.map((k) => (
                    <div key={k.provedor} className={styles.list_row}>
                        <span style={{ flex: 1 }}><strong>{k.nome}</strong> · final …{k.final} · modelo {k.modelo}
                            {!k.conta_paga && <> · <Pill tone="yellow">Gratuita: só sem dados de clientes</Pill></>}
                            <br /><span className={styles.muted}>{k.ultimo_uso ? `Último uso ${fmtDateTime(k.ultimo_uso)}` : 'Ainda não usada'}</span></span>
                        {data.pode_configurar && <>
                            <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => test(k.provedor)}>Testar</button>
                            <button type="button" className={`${styles.btn} ${styles.btn_sm}`} aria-label={`Remover ${k.nome}`} onClick={() => remove(k.provedor)}><FiTrash2 /></button>
                        </>}
                    </div>
                ))
            )}
            {data.pode_configurar ? (
                <form className={styles.stack} onSubmit={save} autoComplete="off">
                    <div className={styles.filters}>
                        <label className={styles.field}>Provedor
                            <select className={styles.select} value={form.provedor} onChange={(e) => setForm({ ...form, provedor: e.target.value })}>
                                {data.provedores.map((p) => <option key={p.chave} value={p.chave}>{p.nome}</option>)}
                            </select>
                        </label>
                        {form.provedor === 'OLLAMA' ? (
                            <label className={styles.field}>Endereço HTTPS do seu servidor
                                <input className={styles.input} value={form.endereco} placeholder="https://ia.seuescritorio.com.br/v1" onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
                            </label>
                        ) : (
                            <label className={styles.field}>Chave de API
                                <input className={styles.input} type="password" value={form.chave} onChange={(e) => setForm({ ...form, chave: e.target.value })} />
                            </label>
                        )}
                        <label className={styles.field}>Modelo (opcional)
                            <input className={styles.input} value={form.modelo} placeholder="padrão do provedor" onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
                        </label>
                    </div>
                    {selected?.treina_no_gratis && (
                        <label className={styles.check_row}><input type="checkbox" checked={form.conta_paga} onChange={(e) => setForm({ ...form, conta_paga: e.target.checked })} />
                            Minha conta é paga (no plano gratuito este provedor usa os dados para treinar e o Cadrius não envia dados de clientes)</label>
                    )}
                    <div className={styles.btn_row}>
                        <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>Salvar chave</button>
                        {selected && <a href={selected.site} target="_blank" rel="noreferrer" className={styles.muted}>Onde gerar / preços</a>}
                    </div>
                </form>
            ) : <div className={styles.muted}>Só dono ou administrador cadastra a conta de IA do escritório.</div>}
        </section>
    );
}
