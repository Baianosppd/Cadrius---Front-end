import styles from '../ui/ui.module.css';
import { Banner, Pill, StatCard, Stack, Table } from '../ui';
import { n, off } from './util';

export default function IaProvedores({ ai }) {
    if (off(ai)) return <Banner tone="error">Dados de IA indisponíveis.</Banner>;
    return (
        <Stack gap={3}>
            <div className={styles.card_grid}>
                <StatCard title="IA da plataforma" value={ai.ligada ? 'Ligada' : 'DESLIGADA'} tone={ai.ligada ? 'green' : 'red'} note="chave geral em Sistema e operação" />
                <StatCard title="Pedidos de IA (24 h)" value={n(ai.pedidos_24h)} note={`${n(ai.falhas_24h)} falharam`} />
                <StatCard title="Bloqueados pela política" value={n(ai.bloqueados_24h)} />
            </div>
            <Table columns={['Provedor', 'Configurado', 'Plano gratuito', 'Dados de clientes', 'Onde roda']}>
                {ai.provedores.map((p) => (
                    <tr key={p.chave}>
                        <td><strong>{p.nome}</strong></td>
                        <td data-label="Configurado">{p.configurado ? <Pill tone="green">Sim</Pill> : <Pill tone="gray">Não</Pill>}</td>
                        <td data-label="Plano gratuito">{p.gratuito || '—'}</td>
                        <td data-label="Dados de clientes">{p.treina_com_dados ? <Pill tone="yellow">Bloqueado (treina com os dados)</Pill> : <Pill tone="green">Permitido</Pill>}</td>
                        <td data-label="Onde roda">{p.local ? 'No nosso servidor' : p.regiao}</td>
                    </tr>
                ))}
            </Table>
            <div className={styles.muted}>As chaves ficam só no servidor (.env). Nunca envie chaves por chat, e-mail ou GitHub.</div>
        </Stack>
    );
}
