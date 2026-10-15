import { useEffect, useRef, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import EmailVisualField from '../email/EmailVisualField';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import { Button, Checkbox, Field, FilterBar, FormModal, Input, Row, Select, Stack, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
import { contactsApi } from '../../services/contacts';
import { DAILY_CONFIG, actionsFor, emptyAction, insertVariable, producedVars, ruleBody, ruleToForm, rulesApi, triggerHasDeadline } from '../../services/rules';

// Texto com botões de variáveis: clicar insere {{variavel}} onde está o cursor
function TemplateText({ label, value, onChange, vars, multiline, max }) {
    const ref = useRef(null);
    const Control = multiline ? Textarea : Input;
    const add = (key) => {
        const pos = ref.current?.selectionStart;
        onChange(insertVariable(value || '', key, pos));
        setTimeout(() => ref.current?.focus(), 0);
    };
    return (
        <Field label={label}>
            <Control ref={ref} value={value || ''} maxLength={max} onChange={(e) => onChange(e.target.value)} />
            <Row gap={1}>
                {vars.map((v) => (
                    <Button key={v.chave} size="xs" title={v.label} onClick={() => add(v.chave)}>{`{{${v.chave}}}`}</Button>
                ))}
            </Row>
        </Field>
    );
}

// Campo "dias úteis" que muda conforme a data é contada do evento ou do prazo (tarefa e compromisso do Google)
// CAD-234: "Para" = cliente/contato do evento ou um contato fixo (contato:<id>), achado pelo nome
export function RecipientField({ value, onChange, trigger, labels }) {
    const fixedId = typeof value === 'string' && value.startsWith('contato:') ? value.slice(8) : '';
    const [picking, setPicking] = useState(!!fixedId || !trigger.destinatarios.length);
    const [chosen, setChosen] = useState(null);
    const [q, setQ] = useState('');
    const [found, setFound] = useState([]);
    useEffect(() => {
        if (fixedId && chosen?.id !== Number(fixedId)) contactsApi.get(fixedId).then((c) => setChosen({ id: c.id, name: c.name })).catch(() => setChosen(null));
    }, [fixedId, chosen?.id]);
    useEffect(() => {
        if (!picking || q.trim().length < 2) return undefined;
        const t = setTimeout(() => contactsApi.list({ q }).then((r) => setFound((r.resultados || []).slice(0, 6))).catch(() => setFound([])), 250);
        return () => clearTimeout(t);
    }, [q, picking]);
    const pick = (mode) => {
        if (mode === 'fixo') { setPicking(true); return; }
        setPicking(false);
        onChange(mode);
    };
    return (
        <Stack gap={2}>
            <Field label="Para">
                <Select value={picking ? 'fixo' : value} onChange={(e) => pick(e.target.value)}>
                    {trigger.destinatarios.map((d) => <option key={d} value={d}>{labels[d] || d}</option>)}
                    <option value="fixo">Um contato específico…</option>
                </Select>
            </Field>
            {picking && (chosen && fixedId ? (
                <Row><span>Para <strong>{chosen.name}</strong></span>
                    <Button size="sm" onClick={() => { setChosen(null); onChange(''); }}>Trocar</Button></Row>
            ) : (
                <Stack gap={1}>
                    <Input aria-label="Buscar contato" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Digite o nome do contato" />
                    {(q.trim().length >= 2 ? found : []).map((c) => (
                        <Button key={c.id} size="sm" className={styles.w_fit} onClick={() => { setChosen({ id: c.id, name: c.name }); onChange(`contato:${c.id}`); }}>
                            {c.name}{c.email ? ` · ${c.email}` : ''}</Button>
                    ))}
                    <span className={styles.muted}>Não está nos contatos? Peça ao Assistente: ele cadastra o contato junto com a automação.</span>
                </Stack>
            ))}
        </Stack>
    );
}

function DiasField({ p, set, antesLabel }) {
    return p.quando === 'prazo'
        ? <Field label={antesLabel}><Input type="number" min={0} max={30} value={p.antecedencia ?? 0} onChange={(e) => set('antecedencia', e.target.value)} /></Field>
        : <Field label="Dias úteis (0 = hoje)"><Input type="number" min={0} max={60} value={p.dias ?? 0} onChange={(e) => set('dias', e.target.value)} /></Field>;
}

function ActionFields({ action, onChange, trigger, vars, catalog }) {
    const p = action.params;
    const set = (k, v) => onChange({ ...action, params: { ...p, [k]: v } });
    const text = (k, label, opts = {}) => <TemplateText label={label} value={p[k]} onChange={(v) => set(k, v)} vars={vars} {...opts} />;
    const slug = (v) => v.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    switch (action.type) {
        case 'create_task':
            return (<>
                {text('titulo', 'Título da tarefa', { max: 255 })}
                {text('descricao', 'Descrição', { multiline: true })}
                <FilterBar>
                    <Field label="Prioridade">
                        <Select value={p.prioridade} onChange={(e) => set('prioridade', e.target.value)}>
                            <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
                        </Select>
                    </Field>
                    <Field label="Data da tarefa">
                        <Select value={p.quando} onChange={(e) => set('quando', e.target.value)}>
                            <option value="dias_uteis">Dias úteis a partir do evento</option>
                            {triggerHasDeadline(trigger.id) && <option value="prazo">Antes da data do prazo</option>}
                        </Select>
                    </Field>
                    <DiasField p={p} set={set} antesLabel="Dias úteis antes do prazo" />
                </FilterBar>
            </>);
        case 'notify':
            return (<>{text('titulo', 'Título do aviso', { max: 120 })}{text('mensagem', 'Mensagem', { multiline: true, max: 500 })}</>);
        case 'send_message':
            return (<>
                <RecipientField value={p.destinatario} onChange={(v) => set('destinatario', v)} trigger={trigger}
                    labels={{ cliente: 'Cliente', contato: 'O contato do evento' }} />
                <FilterBar>
                    <Field label="Canal">
                        <Select value={p.canal} onChange={(e) => set('canal', e.target.value)}>
                            <option value="melhor">Melhor canal autorizado (WhatsApp, senão e-mail)</option>
                            <option value="whatsapp">Só WhatsApp</option><option value="email">Só e-mail</option>
                        </Select>
                    </Field>
                </FilterBar>
                {text('assunto', 'Assunto (se for por e-mail)', { max: 150 })}
                {text('mensagem', 'Mensagem', { multiline: true, max: 1000 })}
                {p.canal !== 'whatsapp' && <EmailVisualField value={p.visual} onChange={(v) => set('visual', v)} assunto={p.assunto} mensagem={p.mensagem} />}
                <p className={styles.muted}>Fora do horário comercial, o envio sai no próximo horário permitido.</p>
            </>);
        case 'send_survey':
            return (<>
                <FilterBar>
                    <Field label="Canal">
                        <Select value={p.canal} onChange={(e) => set('canal', e.target.value)}>
                            <option value="melhor">Melhor canal autorizado</option><option value="whatsapp">Só WhatsApp</option><option value="email">Só e-mail</option>
                        </Select>
                    </Field>
                </FilterBar>
                {text('motivo', 'Motivo (aparece no resultado; ex.: Contrato concluído)', { max: 120 })}
                {text('mensagem', 'Mensagem (o link da pesquisa entra no fim)', { multiline: true, max: 800 })}
                <p className={styles.muted}>O cliente responde de 0 a 10 por um link único (válido por 30 dias). A resposta dispara o gatilho
                    "Cliente respondeu a pesquisa de satisfação" e entra no NPS em Marketing → Resultados.</p>
            </>);
        case 'send_whatsapp':
        case 'send_email':
            return (<>
                <RecipientField value={p.destinatario} onChange={(v) => set('destinatario', v)} trigger={trigger}
                    labels={{ cliente: 'Cliente do processo', contato: 'O contato cadastrado' }} />
                {action.type === 'send_email' && text('assunto', 'Assunto', { max: 150 })}
                {text('mensagem', 'Mensagem', { multiline: true, max: 1000 })}
                {action.type === 'send_email' && <EmailVisualField value={p.visual} onChange={(v) => set('visual', v)} assunto={p.assunto} mensagem={p.mensagem} />}
                <p className={styles.muted}>Só para quem autorizou este canal.</p>
            </>);
        case 'team_chat':
            return (<>
                <Field label="Canal">
                    <Select value={p.canal} onChange={(e) => set('canal', e.target.value)}>
                        <option value="slack">Slack</option><option value="teams">Microsoft Teams</option><option value="telegram">Telegram</option>
                    </Select>
                </Field>
                {text('mensagem', 'Mensagem', { multiline: true, max: 1000 })}
                <p className={styles.muted}>Usa a conexão do app em Integrações. Vai para um serviço externo: por padrão espera aprovação.</p>
            </>);
        case 'erp_call':
            return (<>
                <FilterBar>
                    <Field label="Nº do conector"><Input type="number" value={p.conector_id} onChange={(e) => set('conector_id', e.target.value)} /></Field>
                    <Field label="Operação"><Input value={p.operacao} onChange={(e) => set('operacao', e.target.value)} /></Field>
                </FilterBar>
                <p className={styles.muted}>Chamadas ao ERP sempre esperam aprovação de alguém da equipe.</p>
            </>);
        // ---------------------------------------------------------------- CAD-230: processamento e Google
        case 'calcular':
            return (<>
                <FilterBar>
                    <Field label="Nome do resultado">
                        <Input value={p.nome} placeholder="multa" maxLength={30} onChange={(e) => set('nome', slug(e.target.value))} />
                    </Field>
                    <Field label="Mostrar como">
                        <Select value={p.formato} onChange={(e) => set('formato', e.target.value)}>
                            <option value="moeda">Moeda (R$)</option><option value="numero">Número</option>
                            <option value="inteiro">Inteiro</option><option value="percentual">Percentual</option>
                        </Select>
                    </Field>
                </FilterBar>
                {text('expressao', 'Conta', { max: 400 })}
                <p className={styles.muted}>Ex.: <code>{'{{honorario.valor}} * 2% + {{honorario.valor}} * 0,033% * {{honorario.dias_atraso}}'}</code>.
                    Vírgula para decimais e ";" entre argumentos. Funções: {catalog?.processamento?.funcoes}.
                    Use nos passos seguintes como <code>{`{{calc.${p.nome || 'nome'}}}`}</code>.</p>
            </>);
        case 'tabela':
            return (<>
                <FilterBar>
                    <Field label="Nome da tabela">
                        <Input value={p.nome} placeholder="abertos" maxLength={30} onChange={(e) => set('nome', slug(e.target.value))} />
                    </Field>
                    <Field label="Dados">
                        <Select value={p.fonte} onChange={(e) => set('fonte', e.target.value)}>
                            {Object.entries(catalog?.processamento?.fontes || {}).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                        </Select>
                    </Field>
                    <Field label="Máximo de linhas">
                        <Input type="number" min={1} max={200} value={p.limite ?? 50} onChange={(e) => set('limite', e.target.value)} />
                    </Field>
                </FilterBar>
                {trigger.destinatarios.includes('cliente') && (
                    <Checkbox checked={!!p.do_cliente} onChange={(e) => set('do_cliente', e.target.checked)}>Só do cliente do evento</Checkbox>
                )}
                <p className={styles.muted}>A tabela existe só durante a execução. Use <code>{`{{tabela.${p.nome || 'nome'}.texto}}`}</code> numa mensagem,
                    <code>{`.total`}</code> e <code>{`.quantidade`}</code> em contas e condições, ou copie para uma planilha do Google.</p>
            </>);
        case 'google_planilha':
            return (<>
                {text('planilha', 'Nome da planilha no seu Google Drive', { max: 100 })}
                <Field label="Copiar uma tabela temporária (opcional)">
                    <Input value={p.tabela} placeholder="abertos" onChange={(e) => set('tabela', e.target.value.toLowerCase())} />
                </Field>
                {!p.tabela && text('colunas', 'Colunas da linha (Coluna=valor; Coluna=valor)', { max: 2000 })}
                <p className={styles.muted}>Na 1ª vez o Cadrius cria a planilha (com cabeçalho); depois só acrescenta linhas. Usa o Google do responsável
                    do evento ou de quem criou a regra (Integrações → Google).</p>
            </>);
        case 'google_evento':
            return (<>
                {text('titulo', 'Título do compromisso', { max: 255 })}
                {text('descricao', 'Descrição', { multiline: true })}
                <FilterBar>
                    <Field label="Data">
                        <Select value={p.quando} onChange={(e) => set('quando', e.target.value)}>
                            <option value="dias_uteis">Dias úteis a partir do evento</option>
                            {triggerHasDeadline(trigger.id) && <option value="prazo">Antes da data do prazo</option>}
                        </Select>
                    </Field>
                    <DiasField p={p} set={set} antesLabel="Dias úteis antes" />
                    <Field label="Hora"><Input type="time" value={p.hora || '09:00'} onChange={(e) => set('hora', e.target.value)} /></Field>
                    <Field label="Duração (min)"><Input type="number" min={5} max={1440} value={p.duracao_min ?? 60} onChange={(e) => set('duracao_min', e.target.value)} /></Field>
                </FilterBar>
            </>);
        default:
            return null;
    }
}

// CAD-230: "Só fazer este passo se…" (vale para resultados de cálculo e tabelas dos passos anteriores)
function StepCondition({ action, onChange, vars, operadores }) {
    const c = action.somente_se;
    if (!c) {
        return <Button size="sm" variant="ghost" icon={FiPlus} className={styles.w_fit}
            onClick={() => onChange({ ...action, somente_se: { field: vars[vars.length - 1]?.chave || '', op: 'gt', value: '' } })}>Só fazer se…</Button>;
    }
    const set = (k, v) => onChange({ ...action, somente_se: { ...c, [k]: v } });
    return (
        <FilterBar aria-label="Condição do passo">
            <Field label="Só se">
                <Select value={c.field} onChange={(e) => set('field', e.target.value)}>
                    {vars.map((v) => <option key={v.chave} value={v.chave}>{v.label}</option>)}
                </Select>
            </Field>
            <Field label="Regra">
                <Select value={c.op} onChange={(e) => set('op', e.target.value)}>
                    {operadores.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </Select>
            </Field>
            {!['exists', 'not_exists'].includes(c.op) && (
                <Field label="Valor"><Input value={c.value || ''} onChange={(e) => set('value', e.target.value)} /></Field>
            )}
            <Button onClick={() => { const { somente_se: _drop, ...rest } = action; onChange(rest); }}>Tirar condição</Button>
        </FilterBar>
    );
}

// Campo numérico da configuração do gatilho (dias antes, dias de atraso…)
function CfgNumber({ label, value, min, max, onChange }) {
    return <Field label={label}><Input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} /></Field>;
}

export default function RuleEditor({ catalog, rule, onDone, onCancel }) {
    const [form, setForm] = useState(ruleToForm(rule));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const trigger = catalog.gatilhos.find((g) => g.id === form.gatilho) || catalog.gatilhos[0];
    const vars = trigger.variaveis;
    const available = actionsFor(catalog, form.gatilho);
    const cfg = form.gatilho_config;
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
        <FormModal title={form.id ? 'Editar regra' : 'Nova regra'} size="lg" onClose={onCancel} onSubmit={save} busy={busy} error={error}>
            <Field label="Nome"><Input value={form.nome} onChange={(e) => set('nome', e.target.value)} maxLength={120} /></Field>

            <div className={`${styles.section_title} ${styles.mb_0}`}>1. Quando</div>
            <Field label="Gatilho" hint={trigger.ajuda}>
                <Select value={form.gatilho} onChange={(e) => changeTrigger(e.target.value)}>
                    {catalog.gatilhos.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                </Select>
            </Field>
            {form.gatilho === 'deadline_soon' && (
                <CfgNumber label="Avisar com quantos dias úteis de antecedência" min={1} max={30} value={cfg.dias_antes ?? 3} onChange={(v) => setCfg('dias_antes', v)} />
            )}
            {form.gatilho === 'calendar_event' && (
                <CfgNumber label="Quantos dias antes do compromisso (0 = no próprio dia, a partir das 8h)" min={0} max={30} value={cfg.dias_antes ?? 1} onChange={(v) => setCfg('dias_antes', v)} />
            )}
            {form.gatilho === 'task_overdue' && (
                <CfgNumber label="Dias de atraso (0 = assim que passar do horário)" min={0} max={30} value={cfg.dias_atraso ?? 1} onChange={(v) => setCfg('dias_atraso', v)} />
            )}
            {form.gatilho === 'shortcut' && (
                <Field label="Frases de voz que disparam a regra (separe por vírgula)"
                    hint={<>Fale a frase no relógio ou celular (Relógio e voz). O que vier depois dela vira {'{{atalho.texto}}'}.</>}>
                    <Input placeholder="cheguei ao fórum, estou no fórum"
                        value={Array.isArray(cfg.frases) ? cfg.frases.join(', ') : (cfg.frases || '')}
                        onChange={(e) => setCfg('frases', e.target.value)} />
                </Field>
            )}
            {DAILY_CONFIG[form.gatilho] && (
                <CfgNumber label={DAILY_CONFIG[form.gatilho].label} min={DAILY_CONFIG[form.gatilho].min} max={DAILY_CONFIG[form.gatilho].max}
                    value={cfg[DAILY_CONFIG[form.gatilho].key] ?? DAILY_CONFIG[form.gatilho].def}
                    onChange={(v) => setCfg(DAILY_CONFIG[form.gatilho].key, v)} />
            )}
            {form.gatilho === 'survey_answered' && (
                <p className={styles.muted}>Dica: condição <strong>pesquisa.classificacao</strong> = detrator (0 a 6), neutro (7 e 8) ou promotor (9 e 10).</p>
            )}
            {form.gatilho === 'email_received' && (
                <p className={styles.muted}>Dica: em "Condições", use <strong>email.categoria</strong> (intimacao, cliente, agenda, financeiro, comercial,
                    documento, marketing, outro) e <strong>email.urgencia</strong> (alta, media, baixa).</p>
            )}
            {form.gatilho === 'receivable_due' && (
                <FilterBar>
                    <Field label="Quando">
                        <Select value={cfg.quando || 'antes'} onChange={(e) => setCfg('quando', e.target.value)}>
                            <option value="antes">Antes do vencimento</option><option value="vencido">Depois de vencido (sem pagamento)</option>
                        </Select>
                    </Field>
                    <CfgNumber label="Dias" min={0} max={60} value={cfg.dias ?? 3} onChange={(v) => setCfg('dias', v)} />
                </FilterBar>
            )}
            {form.gatilho === 'schedule' && (
                <FilterBar>
                    <Field label="Frequência">
                        <Select value={cfg.frequencia || 'diaria'} onChange={(e) => setCfg('frequencia', e.target.value)}>
                            <option value="diaria">Todo dia</option><option value="semanal">Toda semana</option>
                        </Select>
                    </Field>
                    {cfg.frequencia === 'semanal' && (
                        <Field label="Dia">
                            <Select value={cfg.dia_semana ?? 0} onChange={(e) => setCfg('dia_semana', Number(e.target.value))}>
                                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((d, i) => <option key={d} value={i}>{d}</option>)}
                            </Select>
                        </Field>
                    )}
                    <CfgNumber label="A partir das (hora)" min={0} max={23} value={cfg.hora ?? 8} onChange={(v) => setCfg('hora', v)} />
                    <Checkbox checked={cfg.so_dias_uteis !== false} onChange={(e) => setCfg('so_dias_uteis', e.target.checked)}>Só em dias úteis</Checkbox>
                </FilterBar>
            )}

            <div className={`${styles.section_title} ${styles.mb_0}`}>2. Se (opcional — todas precisam valer)</div>
            {form.condicoes.map((c, i) => (
                <FilterBar key={i}>
                    <Field label="Campo">
                        <Select value={c.field} onChange={(e) => setCond(i, { field: e.target.value })}>
                            {vars.map((v) => <option key={v.chave} value={v.chave}>{v.label}</option>)}
                        </Select>
                    </Field>
                    <Field label="Regra">
                        <Select value={c.op} onChange={(e) => setCond(i, { op: e.target.value })}>
                            {catalog.operadores.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </Select>
                    </Field>
                    {!['exists', 'not_exists'].includes(c.op) && (
                        <Field label={`Valor${c.op === 'in' ? ' (separe por vírgula)' : ''}`}>
                            <Input value={Array.isArray(c.value) ? c.value.join(', ') : c.value || ''} onChange={(e) => setCond(i, { value: e.target.value })} />
                        </Field>
                    )}
                    <Button onClick={() => set('condicoes', form.condicoes.filter((_, j) => j !== i))}>Remover</Button>
                </FilterBar>
            ))}
            <Button icon={FiPlus} className={styles.w_fit} onClick={() => set('condicoes', [...form.condicoes, { field: vars[0]?.chave, op: 'eq', value: '' }])}>Condição</Button>

            <div className={`${styles.section_title} ${styles.mb_0}`}>3. Então</div>
            {form.acoes.map((a, i) => (
                <Stack key={i} gap={3} className={styles.card}>
                    <div className={styles.header_row}>
                        <strong>{i + 1}. {catalog.acoes.find((x) => x.id === a.type)?.label}</strong>
                        <Button size="sm" onClick={() => set('acoes', form.acoes.filter((_, j) => j !== i))}>Remover</Button>
                    </div>
                    <ActionFields action={a} trigger={trigger} vars={[...vars, ...producedVars(form.acoes, i)]} catalog={catalog} onChange={(x) => setAction(i, x)} />
                    <StepCondition action={a} vars={[...vars, ...producedVars(form.acoes, i)]} operadores={catalog.operadores} onChange={(x) => setAction(i, x)} />
                </Stack>
            ))}
            <Row>
                {available.map((a) => (
                    <Button key={a.id} icon={FiPlus} onClick={() => set('acoes', [...form.acoes, emptyAction(a.id, trigger.destinatarios)])}>{a.label}</Button>
                ))}
            </Row>
            {form.acoes.some((a) => ['send_whatsapp', 'send_email', 'send_message', 'send_survey'].includes(a.type)) && (
                <Checkbox checked={form.exige_aprovacao} onChange={(e) => set('exige_aprovacao', e.target.checked)}>
                    Pedir aprovação de alguém da equipe antes de enviar (recomendado)
                </Checkbox>
            )}
            <p className={styles.muted}>A regra é salva desligada. Use "Simular" para ver o que ela faria e depois ligue.</p>
        </FormModal>
    );
}
