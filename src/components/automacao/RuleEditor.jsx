import { useRef, useState } from 'react';
import EmailVisualField from '../email/EmailVisualField';
import { toast } from 'react-toastify';
import styles from '../seguranca/seguranca.module.css';
import { Banner, errorMessage } from '../seguranca/ui';
import { DAILY_CONFIG, actionsFor, emptyAction, insertVariable, producedVars, ruleBody, ruleToForm, rulesApi, triggerHasDeadline } from '../../services/rules';

// Texto com botões de variáveis: clicar insere {{variavel}} onde está o cursor
function TemplateText({ label, value, onChange, vars, multiline, max }) {
    const ref = useRef(null);
    const Tag = multiline ? 'textarea' : 'input';
    const add = (key) => {
        const pos = ref.current?.selectionStart;
        onChange(insertVariable(value || '', key, pos));
        setTimeout(() => ref.current?.focus(), 0);
    };
    return (
        <label className={styles.field}>{label}
            <Tag ref={ref} className={multiline ? styles.textarea : styles.input} value={value || ''} maxLength={max}
                onChange={(e) => onChange(e.target.value)} />
            <span className={styles.btn_row} style={{ gap: 4 }}>
                {vars.map((v) => (
                    <button key={v.chave} type="button" className={styles.btn} style={{ padding: '2px 8px', fontSize: 12 }} title={v.label}
                        onClick={() => add(v.chave)}>{`{{${v.chave}}}`}</button>
                ))}
            </span>
        </label>
    );
}

function ActionFields({ action, onChange, trigger, vars, catalog }) {
    const p = action.params;
    const set = (k, v) => onChange({ ...action, params: { ...p, [k]: v } });
    const text = (k, label, opts = {}) => <TemplateText label={label} value={p[k]} onChange={(v) => set(k, v)} vars={vars} {...opts} />;
    switch (action.type) {
        case 'create_task':
            return (<>
                {text('titulo', 'Título da tarefa', { max: 255 })}
                {text('descricao', 'Descrição', { multiline: true })}
                <div className={styles.filters}>
                    <label className={styles.field}>Prioridade
                        <select className={styles.select} value={p.prioridade} onChange={(e) => set('prioridade', e.target.value)}>
                            <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
                        </select>
                    </label>
                    <label className={styles.field}>Data da tarefa
                        <select className={styles.select} value={p.quando} onChange={(e) => set('quando', e.target.value)}>
                            <option value="dias_uteis">Dias úteis a partir do evento</option>
                            {triggerHasDeadline(trigger.id) && <option value="prazo">Antes da data do prazo</option>}
                        </select>
                    </label>
                    {p.quando === 'prazo'
                        ? <label className={styles.field}>Dias úteis antes do prazo<input className={styles.input} type="number" min={0} max={30} value={p.antecedencia ?? 0} onChange={(e) => set('antecedencia', e.target.value)} /></label>
                        : <label className={styles.field}>Dias úteis (0 = hoje)<input className={styles.input} type="number" min={0} max={60} value={p.dias ?? 0} onChange={(e) => set('dias', e.target.value)} /></label>}
                </div>
            </>);
        case 'notify':
            return (<>{text('titulo', 'Título do aviso', { max: 120 })}{text('mensagem', 'Mensagem', { multiline: true, max: 500 })}</>);
        case 'send_message':
            return (<>
                <div className={styles.filters}>
                    <label className={styles.field}>Para
                        <select className={styles.select} value={p.destinatario} onChange={(e) => set('destinatario', e.target.value)}>
                            {trigger.destinatarios.map((d) => <option key={d} value={d}>{d === 'cliente' ? 'Cliente' : 'O contato do evento'}</option>)}
                        </select>
                    </label>
                    <label className={styles.field}>Canal
                        <select className={styles.select} value={p.canal} onChange={(e) => set('canal', e.target.value)}>
                            <option value="melhor">Melhor canal autorizado (WhatsApp, senão e-mail)</option>
                            <option value="whatsapp">Só WhatsApp</option><option value="email">Só e-mail</option>
                        </select>
                    </label>
                </div>
                {text('assunto', 'Assunto (se for por e-mail)', { max: 150 })}
                {text('mensagem', 'Mensagem', { multiline: true, max: 1000 })}
                {p.canal !== 'whatsapp' && <EmailVisualField value={p.visual} onChange={(v) => set('visual', v)} assunto={p.assunto} mensagem={p.mensagem} />}
                <p className={styles.muted}>Só envia por canal que o cliente autorizou (LGPD). Fora do horário comercial (8h às 20h, segunda a sábado)
                    o envio fica agendado para o próximo horário permitido.</p>
            </>);
        case 'send_survey':
            return (<>
                <div className={styles.filters}>
                    <label className={styles.field}>Canal
                        <select className={styles.select} value={p.canal} onChange={(e) => set('canal', e.target.value)}>
                            <option value="melhor">Melhor canal autorizado</option><option value="whatsapp">Só WhatsApp</option><option value="email">Só e-mail</option>
                        </select>
                    </label>
                </div>
                {text('motivo', 'Motivo (aparece no resultado; ex.: Contrato concluído)', { max: 120 })}
                {text('mensagem', 'Mensagem (o link da pesquisa entra no fim)', { multiline: true, max: 800 })}
                <p className={styles.muted}>O cliente responde de 0 a 10 por um link único (válido por 30 dias). A resposta dispara o gatilho
                    "Cliente respondeu a pesquisa de satisfação" e entra no NPS em Marketing → Resultados.</p>
            </>);
        case 'send_whatsapp':
        case 'send_email':
            return (<>
                <label className={styles.field}>Para
                    <select className={styles.select} value={p.destinatario} onChange={(e) => set('destinatario', e.target.value)}>
                        {trigger.destinatarios.map((d) => <option key={d} value={d}>{d === 'cliente' ? 'Cliente do processo' : 'O contato cadastrado'}</option>)}
                    </select>
                </label>
                {action.type === 'send_email' && text('assunto', 'Assunto', { max: 150 })}
                {text('mensagem', 'Mensagem', { multiline: true, max: 1000 })}
                {action.type === 'send_email' && <EmailVisualField value={p.visual} onChange={(v) => set('visual', v)} assunto={p.assunto} mensagem={p.mensagem} />}
                <p className={styles.muted}>Só envia a quem autorizou este canal no cadastro do contato (LGPD).</p>
            </>);
        case 'team_chat':
            return (<>
                <label className={styles.field}>Canal
                    <select className={styles.select} value={p.canal} onChange={(e) => set('canal', e.target.value)}>
                        <option value="slack">Slack</option><option value="teams">Microsoft Teams</option><option value="telegram">Telegram</option>
                    </select>
                </label>
                {text('mensagem', 'Mensagem', { multiline: true, max: 1000 })}
                <p className={styles.muted}>Usa a conexão do app em Integrações. Vai para um serviço externo: por padrão espera aprovação.</p>
            </>);
        case 'erp_call':
            return (<>
                <div className={styles.filters}>
                    <label className={styles.field}>Nº do conector<input className={styles.input} type="number" value={p.conector_id} onChange={(e) => set('conector_id', e.target.value)} /></label>
                    <label className={styles.field}>Operação<input className={styles.input} value={p.operacao} onChange={(e) => set('operacao', e.target.value)} /></label>
                </div>
                <p className={styles.muted}>Chamadas ao ERP sempre esperam aprovação de alguém da equipe.</p>
            </>);
        // ---------------------------------------------------------------- CAD-230: processamento e Google
        case 'calcular':
            return (<>
                <div className={styles.filters}>
                    <label className={styles.field}>Nome do resultado
                        <input className={styles.input} value={p.nome} placeholder="multa" maxLength={30}
                            onChange={(e) => set('nome', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} /></label>
                    <label className={styles.field}>Mostrar como
                        <select className={styles.select} value={p.formato} onChange={(e) => set('formato', e.target.value)}>
                            <option value="moeda">Moeda (R$)</option><option value="numero">Número</option>
                            <option value="inteiro">Inteiro</option><option value="percentual">Percentual</option>
                        </select></label>
                </div>
                {text('expressao', 'Conta', { max: 400 })}
                <p className={styles.muted}>Ex.: <code>{'{{honorario.valor}} * 2% + {{honorario.valor}} * 0,033% * {{honorario.dias_atraso}}'}</code>.
                    Vírgula para decimais e ";" entre argumentos. Funções: {catalog?.processamento?.funcoes}.
                    Use nos passos seguintes como <code>{`{{calc.${p.nome || 'nome'}}}`}</code>.</p>
            </>);
        case 'tabela':
            return (<>
                <div className={styles.filters}>
                    <label className={styles.field}>Nome da tabela
                        <input className={styles.input} value={p.nome} placeholder="abertos" maxLength={30}
                            onChange={(e) => set('nome', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} /></label>
                    <label className={styles.field}>Dados
                        <select className={styles.select} value={p.fonte} onChange={(e) => set('fonte', e.target.value)}>
                            {Object.entries(catalog?.processamento?.fontes || {}).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                        </select></label>
                    <label className={styles.field}>Máximo de linhas
                        <input className={styles.input} type="number" min={1} max={200} value={p.limite ?? 50} onChange={(e) => set('limite', e.target.value)} /></label>
                </div>
                {trigger.destinatarios.includes('cliente') && (
                    <label className={styles.check_row}><input type="checkbox" checked={!!p.do_cliente} onChange={(e) => set('do_cliente', e.target.checked)} /> Só do cliente do evento</label>
                )}
                <p className={styles.muted}>A tabela existe só durante a execução. Use <code>{`{{tabela.${p.nome || 'nome'}.texto}}`}</code> numa mensagem,
                    <code>{`.total`}</code> e <code>{`.quantidade`}</code> em contas e condições, ou copie para uma planilha do Google.</p>
            </>);
        case 'google_planilha':
            return (<>
                {text('planilha', 'Nome da planilha no seu Google Drive', { max: 100 })}
                <label className={styles.field}>Copiar uma tabela temporária (opcional)
                    <input className={styles.input} value={p.tabela} placeholder="abertos" onChange={(e) => set('tabela', e.target.value.toLowerCase())} /></label>
                {!p.tabela && text('colunas', 'Colunas da linha (Coluna=valor; Coluna=valor)', { max: 2000 })}
                <p className={styles.muted}>Na 1ª vez o Cadrius cria a planilha (com cabeçalho); depois só acrescenta linhas. Usa o Google do responsável
                    do evento ou de quem criou a regra (Integrações → Google).</p>
            </>);
        case 'google_evento':
            return (<>
                {text('titulo', 'Título do compromisso', { max: 255 })}
                {text('descricao', 'Descrição', { multiline: true })}
                <div className={styles.filters}>
                    <label className={styles.field}>Data
                        <select className={styles.select} value={p.quando} onChange={(e) => set('quando', e.target.value)}>
                            <option value="dias_uteis">Dias úteis a partir do evento</option>
                            {triggerHasDeadline(trigger.id) && <option value="prazo">Antes da data do prazo</option>}
                        </select></label>
                    {p.quando === 'prazo'
                        ? <label className={styles.field}>Dias úteis antes<input className={styles.input} type="number" min={0} max={30} value={p.antecedencia ?? 0} onChange={(e) => set('antecedencia', e.target.value)} /></label>
                        : <label className={styles.field}>Dias úteis (0 = hoje)<input className={styles.input} type="number" min={0} max={60} value={p.dias ?? 0} onChange={(e) => set('dias', e.target.value)} /></label>}
                    <label className={styles.field}>Hora<input className={styles.input} type="time" value={p.hora || '09:00'} onChange={(e) => set('hora', e.target.value)} /></label>
                    <label className={styles.field}>Duração (min)<input className={styles.input} type="number" min={5} max={1440} value={p.duracao_min ?? 60} onChange={(e) => set('duracao_min', e.target.value)} /></label>
                </div>
            </>);
        default:
            return null;
    }
}

// CAD-230: "Só fazer este passo se…" (vale para resultados de cálculo e tabelas dos passos anteriores)
function StepCondition({ action, onChange, vars, operadores }) {
    const c = action.somente_se;
    if (!c) {
        return <button type="button" className={styles.btn} style={{ fontSize: 12 }}
            onClick={() => onChange({ ...action, somente_se: { field: vars[vars.length - 1]?.chave || '', op: 'gt', value: '' } })}>+ Só fazer se…</button>;
    }
    const set = (k, v) => onChange({ ...action, somente_se: { ...c, [k]: v } });
    return (
        <div className={styles.filters} aria-label="Condição do passo">
            <label className={styles.field}>Só se
                <select className={styles.select} value={c.field} onChange={(e) => set('field', e.target.value)}>
                    {vars.map((v) => <option key={v.chave} value={v.chave}>{v.label}</option>)}
                </select></label>
            <label className={styles.field}>Regra
                <select className={styles.select} value={c.op} onChange={(e) => set('op', e.target.value)}>
                    {operadores.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select></label>
            {!['exists', 'not_exists'].includes(c.op) && (
                <label className={styles.field}>Valor<input className={styles.input} value={c.value || ''} onChange={(e) => set('value', e.target.value)} /></label>
            )}
            <button type="button" className={styles.btn} onClick={() => { const { somente_se: _drop, ...rest } = action; onChange(rest); }}>Tirar condição</button>
        </div>
    );
}

export default function RuleEditor({ catalog, rule, onDone, onCancel }) {
    const [form, setForm] = useState(ruleToForm(rule));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const trigger = catalog.gatilhos.find((g) => g.id === form.gatilho) || catalog.gatilhos[0];
    const vars = trigger.variaveis;
    const available = actionsFor(catalog, form.gatilho);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const setCfg = (k, v) => set('gatilho_config', { ...form.gatilho_config, [k]: v });
    const changeTrigger = (id) => setForm((f) => ({ ...f, gatilho: id, gatilho_config: {}, condicoes: [], acoes: [] }));
    const setAction = (i, a) => set('acoes', form.acoes.map((x, j) => (j === i ? a : x)));
    const setCond = (i, c) => set('condicoes', form.condicoes.map((x, j) => (j === i ? { ...x, ...c } : x)));

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const body = ruleBody(form);
            const saved = form.id ? await rulesApi.update(form.id, body) : await rulesApi.create(body);
            toast.success(saved.desligada_para_simular ? 'Regra salva e desligada: simule de novo para ligar.' : 'Regra salva.');
            onDone(saved);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <form className={styles.modal} onSubmit={save} style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }}>
                <div className={styles.modal_title}>{form.id ? 'Editar regra' : 'Nova regra'}</div>
                <label className={styles.field}>Nome<input className={styles.input} value={form.nome} onChange={(e) => set('nome', e.target.value)} maxLength={120} autoFocus /></label>

                <div className={styles.section_title}>1. Quando</div>
                <label className={styles.field}>Gatilho
                    <select className={styles.select} value={form.gatilho} onChange={(e) => changeTrigger(e.target.value)}>
                        {catalog.gatilhos.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                    </select>
                </label>
                <p className={styles.muted}>{trigger.ajuda}</p>
                {form.gatilho === 'deadline_soon' && (
                    <label className={styles.field}>Avisar com quantos dias úteis de antecedência
                        <input className={styles.input} type="number" min={1} max={30} value={form.gatilho_config.dias_antes ?? 3} onChange={(e) => setCfg('dias_antes', Number(e.target.value))} />
                    </label>
                )}
                {form.gatilho === 'calendar_event' && (
                    <label className={styles.field}>Quantos dias antes do compromisso (0 = no próprio dia, a partir das 8h)
                        <input className={styles.input} type="number" min={0} max={30} value={form.gatilho_config.dias_antes ?? 1} onChange={(e) => setCfg('dias_antes', Number(e.target.value))} />
                    </label>
                )}
                {form.gatilho === 'task_overdue' && (
                    <label className={styles.field}>Dias de atraso (0 = assim que passar do horário)
                        <input className={styles.input} type="number" min={0} max={30} value={form.gatilho_config.dias_atraso ?? 1} onChange={(e) => setCfg('dias_atraso', Number(e.target.value))} />
                    </label>
                )}
                {form.gatilho === 'shortcut' && (
                    <label className={styles.field}>Frases de voz que disparam a regra (separe por vírgula)
                        <input className={styles.input} placeholder="cheguei ao fórum, estou no fórum"
                            value={Array.isArray(form.gatilho_config.frases) ? form.gatilho_config.frases.join(', ') : (form.gatilho_config.frases || '')}
                            onChange={(e) => setCfg('frases', e.target.value)} />
                        <span className={styles.muted} style={{ fontWeight: 400 }}>Fale a frase no relógio ou celular (Relógio e voz). O que vier depois dela vira {'{{atalho.texto}}'}.</span>
                    </label>
                )}
                {DAILY_CONFIG[form.gatilho] && (
                    <label className={styles.field}>{DAILY_CONFIG[form.gatilho].label}
                        <input className={styles.input} type="number" min={DAILY_CONFIG[form.gatilho].min} max={DAILY_CONFIG[form.gatilho].max}
                            value={form.gatilho_config[DAILY_CONFIG[form.gatilho].key] ?? DAILY_CONFIG[form.gatilho].def}
                            onChange={(e) => setCfg(DAILY_CONFIG[form.gatilho].key, Number(e.target.value))} />
                    </label>
                )}
                {form.gatilho === 'survey_answered' && (
                    <p className={styles.muted}>Dica: condição <strong>pesquisa.classificacao</strong> = detrator (0 a 6), neutro (7 e 8) ou promotor (9 e 10).</p>
                )}
                {form.gatilho === 'email_received' && (
                    <p className={styles.muted}>Dica: em "Condições", use <strong>email.categoria</strong> (intimacao, cliente, agenda, financeiro, comercial,
                        documento, marketing, outro) e <strong>email.urgencia</strong> (alta, media, baixa).</p>
                )}
                {form.gatilho === 'receivable_due' && (
                    <div className={styles.filters}>
                        <label className={styles.field}>Quando
                            <select className={styles.select} value={form.gatilho_config.quando || 'antes'} onChange={(e) => setCfg('quando', e.target.value)}>
                                <option value="antes">Antes do vencimento</option><option value="vencido">Depois de vencido (sem pagamento)</option>
                            </select>
                        </label>
                        <label className={styles.field}>Dias
                            <input className={styles.input} type="number" min={0} max={60} value={form.gatilho_config.dias ?? 3} onChange={(e) => setCfg('dias', Number(e.target.value))} />
                        </label>
                    </div>
                )}
                {form.gatilho === 'schedule' && (
                    <div className={styles.filters}>
                        <label className={styles.field}>Frequência
                            <select className={styles.select} value={form.gatilho_config.frequencia || 'diaria'} onChange={(e) => setCfg('frequencia', e.target.value)}>
                                <option value="diaria">Todo dia</option><option value="semanal">Toda semana</option>
                            </select>
                        </label>
                        {form.gatilho_config.frequencia === 'semanal' && (
                            <label className={styles.field}>Dia
                                <select className={styles.select} value={form.gatilho_config.dia_semana ?? 0} onChange={(e) => setCfg('dia_semana', Number(e.target.value))}>
                                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((d, i) => <option key={d} value={i}>{d}</option>)}
                                </select>
                            </label>
                        )}
                        <label className={styles.field}>A partir das (hora)
                            <input className={styles.input} type="number" min={0} max={23} value={form.gatilho_config.hora ?? 8} onChange={(e) => setCfg('hora', Number(e.target.value))} />
                        </label>
                        <label className={styles.check_row}><input type="checkbox" checked={form.gatilho_config.so_dias_uteis !== false}
                            onChange={(e) => setCfg('so_dias_uteis', e.target.checked)} /> Só em dias úteis</label>
                    </div>
                )}

                <div className={styles.section_title}>2. Se (opcional — todas precisam valer)</div>
                {form.condicoes.map((c, i) => (
                    <div key={i} className={styles.filters}>
                        <label className={styles.field}>Campo
                            <select className={styles.select} value={c.field} onChange={(e) => setCond(i, { field: e.target.value })}>
                                {vars.map((v) => <option key={v.chave} value={v.chave}>{v.label}</option>)}
                            </select>
                        </label>
                        <label className={styles.field}>Regra
                            <select className={styles.select} value={c.op} onChange={(e) => setCond(i, { op: e.target.value })}>
                                {catalog.operadores.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                        </label>
                        {!['exists', 'not_exists'].includes(c.op) && (
                            <label className={styles.field}>Valor{c.op === 'in' ? ' (separe por vírgula)' : ''}
                                <input className={styles.input} value={Array.isArray(c.value) ? c.value.join(', ') : c.value || ''} onChange={(e) => setCond(i, { value: e.target.value })} />
                            </label>
                        )}
                        <button type="button" className={styles.btn} onClick={() => set('condicoes', form.condicoes.filter((_, j) => j !== i))}>Remover</button>
                    </div>
                ))}
                <div className={styles.btn_row}>
                    <button type="button" className={styles.btn} onClick={() => set('condicoes', [...form.condicoes, { field: vars[0]?.chave, op: 'eq', value: '' }])}>+ Condição</button>
                </div>

                <div className={styles.section_title}>3. Então</div>
                {form.acoes.map((a, i) => (
                    <div key={i} className={styles.card} style={{ marginBottom: 8 }}>
                        <div className={styles.header_row}>
                            <strong>{i + 1}. {catalog.acoes.find((x) => x.id === a.type)?.label}</strong>
                            <button type="button" className={styles.btn} onClick={() => set('acoes', form.acoes.filter((_, j) => j !== i))}>Remover</button>
                        </div>
                        <ActionFields action={a} trigger={trigger} vars={[...vars, ...producedVars(form.acoes, i)]} catalog={catalog} onChange={(x) => setAction(i, x)} />
                        <StepCondition action={a} vars={[...vars, ...producedVars(form.acoes, i)]} operadores={catalog.operadores} onChange={(x) => setAction(i, x)} />
                    </div>
                ))}
                <div className={styles.btn_row}>
                    {available.map((a) => (
                        <button key={a.id} type="button" className={styles.btn} onClick={() => set('acoes', [...form.acoes, emptyAction(a.id, trigger.destinatarios)])}>+ {a.label}</button>
                    ))}
                </div>
                {form.acoes.some((a) => ['send_whatsapp', 'send_email', 'send_message', 'send_survey'].includes(a.type)) && (
                    <label className={styles.check_row}>
                        <input type="checkbox" checked={form.exige_aprovacao} onChange={(e) => set('exige_aprovacao', e.target.checked)} />
                        Pedir aprovação de alguém da equipe antes de enviar (recomendado)
                    </label>
                )}
                <p className={styles.muted}>A regra é salva desligada. Use "Simular" para ver o que ela faria e depois ligue.</p>
                {error && <Banner tone="error">{error}</Banner>}
                <div className={styles.btn_row}>
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>Salvar</button>
                    <button type="button" className={styles.btn} onClick={onCancel} disabled={busy}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}
