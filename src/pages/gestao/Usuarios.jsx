import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Empty, Field, FilterBar, Input, Loading, PageHeader, Pill, Row, Select, Table } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';
import ActionModal from '../../components/gestao/ActionModal';
import TempPasswordModal from '../../components/gestao/TempPasswordModal';
import { backofficeApi, userActionsFor } from '../../services/backoffice';
import useLoader from '../../hooks/useLoader';

export default function Usuarios() {
    const [term, setTerm] = useState('');
    const [query, setQuery] = useState({ q: '', equipe: '' });
    const [pending, setPending] = useState(null);   // { user, action }
    const [temp, setTemp] = useState(null);         // { email, senha } — mostrada uma única vez
    const { data, error, reload } = useLoader(() => backofficeApi.users(query), [query.q, query.equipe]);
    const run = async (body) => {
        const result = await backofficeApi.userAction(pending.user.id, body);
        if (result.senha_temporaria) setTemp({ email: pending.user.email, senha: result.senha_temporaria });
        else toast.success('Ação registrada.');
        reload();
    };
    return (
        <div className={styles.page}>
            <PageHeader title="Usuários" subtitle="Acesso, bloqueios e sessões" />
            <FilterBar as="form" onSubmit={(e) => { e.preventDefault(); setQuery((q) => ({ ...q, q: term.trim() })); }}>
                <Field label="E-mail ou nome">
                    <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ana@ ou Ana Souza" />
                </Field>
                <Checkbox checked={query.equipe === '1'} onChange={(e) => setQuery((q) => ({ ...q, equipe: e.target.checked ? '1' : '' }))}>
                    Só equipe Cadrius
                </Checkbox>
                <Button type="submit">Buscar</Button>
            </FilterBar>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && (
                <Table columns={['Conta', 'Escritórios', 'Situação', 'Último acesso', 'Ações']}
                    empty={data.resultados.length === 0 && <Empty>Nenhum usuário encontrado.</Empty>}>
                    {data.resultados.map((u) => (
                        <tr key={u.id}>
                            <td><strong>{u.email}</strong><div className={styles.muted}>{u.nome || '—'}</div>
                                {u.equipe_cadrius && <Pill tone="blue">{u.superusuario ? 'Superusuário' : 'Equipe Cadrius'}</Pill>}</td>
                            <td data-label="Escritórios">{u.escritorios.map((o) => `${o.nome} (${o.papel})`).join(', ') || '—'}</td>
                            <td data-label="Situação">
                                <Row gap={1}>
                                    {u.ativo ? <Pill tone="green">Ativo</Pill> : <Pill tone="gray">Desativado</Pill>}
                                    {u.bloqueado && <Pill tone="red">Login bloqueado</Pill>}
                                    {u.mfa ? <Pill tone="blue">MFA</Pill> : (u.equipe_cadrius && <Pill tone="yellow">Sem MFA</Pill>)}
                                    {u.troca_de_senha_pendente && <Pill tone="yellow">Troca de senha pendente</Pill>}
                                </Row>
                            </td>
                            <td data-label="Último acesso">{fmtDateTime(u.ultimo_acesso)}</td>
                            <td data-label="Ações">
                                <Select value="" aria-label={`Ações para ${u.email}`} onChange={(e) => {
                                    const action = userActionsFor(u).find((a) => a.key === e.target.value);
                                    if (action) setPending({ user: u, action });
                                }}>
                                    <option value="">Escolher…</option>
                                    {userActionsFor(u).map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                                </Select>
                            </td>
                        </tr>
                    ))}
                </Table>
            )}
            {data && data.total > data.resultados.length && <div className={styles.muted}>Mostrando {data.resultados.length} de {data.total}. Refine a busca.</div>}
            {pending && <ActionModal title={pending.action.label} subject={pending.user.email} actionKey={pending.action.key}
                spec={pending.action} onRun={run} onClose={() => setPending(null)} />}
            {temp && <TempPasswordModal email={temp.email} password={temp.senha} onClose={() => setTemp(null)} />}
        </div>
    );
}
