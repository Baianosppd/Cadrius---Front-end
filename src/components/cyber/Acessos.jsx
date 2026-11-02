import styles from '../ui/ui.module.css';
import { Banner, StatCard, Stack } from '../ui';
import { n, off } from './util';

export default function Acessos({ a, chain }) {
    if (off(a)) return <Banner tone="error">Dados de acesso indisponíveis.</Banner>;
    return (
        <Stack gap={3}>
            <div className={styles.card_grid}>
                <StatCard title="Usuários ativos" value={n(a.usuarios_ativos)} note={`${n(a.escritorios_ativos)} escritórios`} />
                <StatCard title="Sessões ativas" value={n(a.sessoes_ativas)} note={`${n(a.pessoas_com_sessao)} pessoas`} />
                <StatCard title="Equipe Cadrius" value={n(a.equipe)} note={`${a.equipe_sem_mfa.length} sem verificação em duas etapas`} tone={a.equipe_sem_mfa.length ? 'red' : 'green'} />
                <StatCard title="Superusuários" value={n(a.superusuarios)} note="mantenha o mínimo possível" tone={a.superusuarios > 2 ? 'yellow' : undefined} />
                <StatCard title="MFA de donos/admins" value={`${a.mfa_gestores_pct}%`} note={`${a.gestores_com_mfa} de ${a.gestores}`} />
                <StatCard title="Troca de senha pendente" value={n(a.troca_de_senha_pendente)} note="senhas temporárias da TI" />
                <StatCard title="Sem acesso há 90 dias" value={n(a.sem_acesso_90_dias)} note="avalie desativar" tone={a.sem_acesso_90_dias ? 'yellow' : undefined} />
                {!off(chain) && <StatCard title="Trilha de auditoria" value={chain.integra ? 'Íntegra' : 'FALHA'} tone={chain.integra ? 'green' : 'red'} note={`${n(chain.verificados)} eventos conferidos`} />}
            </div>
            {a.equipe_sem_mfa.length > 0 && (
                <Banner tone="warn">Sem verificação em duas etapas: {a.equipe_sem_mfa.join(', ')}. Elas só entram na Gestão depois de ativar.</Banner>
            )}
        </Stack>
    );
}
