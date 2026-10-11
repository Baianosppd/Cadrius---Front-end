import { Link } from 'react-router-dom';
import { FiDownload, FiFile } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import { Button, Empty, Field, FilterBar, Input, Pill, Row, Stack, Table } from '../ui';
import { fmtDate } from '../../utils/format';

// Status do documento → rótulo e cor da Pill
const STATUS = {
    pronto: { label: 'Pronto', tone: 'green' },
    processando: { label: 'Processando', tone: 'blue' },
    aguardando_assinatura: { label: 'Aguardando assinatura', tone: 'yellow' },
    assinado: { label: 'Assinado', tone: 'green' },
    erro: { label: 'Erro', tone: 'red' },
};

const TYPE_LABEL = { contrato: 'Contrato', peticao: 'Petição', procuracao: 'Procuração', outro: 'Outro' };

const DocumentList = ({ documents = [], search = '', onSearchChange, onDownload, page = 1, pages = 1, onPage, loading = false }) => (
    <Stack>
        <h2 className={`${ui.section_title} ${ui.mb_0}`}>Todos os documentos</h2>
        <FilterBar>
            <Field label="Buscar"><Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Nome do documento ou cliente" /></Field>
        </FilterBar>
        <Table columns={['Nome', 'Cliente', 'Tipo', 'Data', 'Status', { label: 'Ações', className: ui.td_actions }]} loading={loading && !documents.length}
            empty={!loading && documents.length === 0 && <Empty>Nenhum documento encontrado. Envie o primeiro acima.</Empty>}>
            {documents.map((doc) => {
                const s = STATUS[doc.status] || { label: doc.status, tone: 'gray' };
                return (
                    <tr key={doc.id}>
                        <td>
                            <Row gap={2} wrap={false}>
                                <FiFile aria-hidden="true" className={ui.text_muted} />
                                <Link to={`/documents/${doc.id}`}><strong>{doc.nome}</strong></Link>
                            </Row>
                        </td>
                        <td data-label="Cliente">{doc.cliente || '—'}</td>
                        <td data-label="Tipo"><Pill>{TYPE_LABEL[doc.tipo] || doc.tipo}</Pill></td>
                        <td data-label="Data">{fmtDate(doc.data)}</td>
                        <td data-label="Status"><Pill tone={s.tone}>{s.label}</Pill></td>
                        <td className={ui.td_actions}>
                            <Button size="sm" icon={FiDownload} onClick={() => onDownload(doc)} title="Baixar arquivo">Baixar</Button>
                        </td>
                    </tr>
                );
            })}
        </Table>
        {pages > 1 && (
            <Row justify="end">
                <Button disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button>
                <span className={ui.muted}>Página {page} de {pages}</span>
                <Button disabled={page >= pages} onClick={() => onPage(page + 1)}>Próxima</Button>
            </Row>
        )}
    </Stack>
);

export default DocumentList;
