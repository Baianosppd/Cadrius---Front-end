import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, fmtDateTime } from '../../components/seguranca/ui';
import ActionModal from '../../components/gestao/ActionModal';
import TempPasswordModal from '../../components/gestao/TempPasswordModal';
import { backofficeApi, userActionsFor } from '../../services/backoffice';
import useLoader from './useLoader';

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
            <form className={styles.filters} onSubmit={(e) => { e.preventDefault(); setQuery((q) => ({ ...q, q: term.trim() })); }}>
                <label className={styles.field}>E-mail ou nome
                    <input className={styles.input} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ana@ ou Ana Souza" />
                </label>
                <label className={styles.check_row} style={{ alignSelf: 'center' }}>
                    <input type="checkbox" checked={query.equipe === '1'} onChange={(e) => setQuery((q) => ({ ...q, equipe: e.target.checked ? '1' : '' }))} />
                    Só equipe Cadrius
                </label>
                <button type="submit" className={styles.btn}>Buscar</button>
            </form>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Carregando…</Empty>}
            {data && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Conta</th><th>Escritórios</th><th>Situação</th><th>Último acesso</th><th>Ações</th></tr></thead>
                        <tbody>
                            {data.resultados.length === 0 && <tr><td colSpan={5}><Empty>Nenhum usuário encontrado.</Empty></td></tr>}
                            {data.resultados.map((u) => (
                                <tr key={u.id}>
                                    <td><strong>{u.email}</strong><div className={styles.muted}>{u.nome || '—'}</div>
                                        {u.equipe_cadrius && <Pill tone="blue">{u.superusuario ? 'Superusuário' : 'Equipe Cadrius'}</Pill>}</td>
                                    <td>{u.escritorios.map((o) => `${o.nome} (${o.papel})`).join(', ') || '—'}</td>
                                    <td><span className={styles.btn_row}>
                                        {u.ativo ? <Pill tone="green">Ativo</Pill> : <Pill tone="gray">Desativado</Pill>}
                                        {u.bloqueado && <Pill tone="red">Login bloqueado</Pill>}
                                        {u.mfa ? <Pill tone="blue">MFA</Pill> : (u.equipe_cadrius && <Pill tone="yellow">Sem MFA</Pill>)}
                                        {u.troca_de_senha_pendente && <Pill tone="yellow">Troca de senha pendente</Pill>}
                                    </span></td>
                                    <td>{fmtDateTime(u.ultimo_acesso)}</td>
                                    <td>
                                        <select className={styles.select} value="" onChange={(e) => {
                                            const action = userActionsFor(u).find((a) => a.key === e.target.value);
                                            if (action) setPending({ user: u, action });
                                        }}>
                                            <option value="">Escolher…</option>
                                            {userActionsFor(u).map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {data && data.total > data.resultados.length && <div className={styles.muted}>Mostrando {data.resultados.length} de {data.total}. Refine a busca.</div>}
            {pending && <ActionModal title={pending.action.label} subject={pending.user.email} actionKey={pending.action.key}
                spec={pending.action} onRun={run} onClose={() => setPending(null)} />}
            {temp && <TempPasswordModal email={temp.email} password={temp.senha} onClose={() => setTemp(null)} />}
        </div>
    );
}
