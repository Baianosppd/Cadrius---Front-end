import styles from './DocumentList.module.css';
import { Link } from 'react-router-dom';
import { FiSearch, FiFile, FiDownload } from 'react-icons/fi';

const statusConfig = {
    pronto: { label: 'Pronto', className: 'status_concluido' },
    processando: { label: 'Processando', className: 'status_processando' },
    aguardando_assinatura: { label: 'Aguardando assinatura', className: 'status_processando' },
    assinado: { label: 'Assinado', className: 'status_concluido' },
    erro: { label: 'Erro', className: 'status_erro' },
};

const TYPE_LABEL = { contrato: 'Contrato', peticao: 'Petição', procuracao: 'Procuração', outro: 'Outro' };

const DocumentRow = ({ doc, onDownload }) => {
    const s = statusConfig[doc.status] || { label: doc.status, className: 'status_processando' };

    return (
        <tr className={styles.row}>
            <td className={styles.cell_name}>
                <FiFile className={styles.file_icon} />
                <Link to={`/documents/${doc.id}`} style={{ color: 'inherit' }}>{doc.nome}</Link>
            </td>
            <td className={styles.cell}>{doc.cliente || '—'}</td>
            <td className={styles.cell}>
                <span className={styles.type_badge}>{TYPE_LABEL[doc.tipo] || doc.tipo}</span>
            </td>
            <td className={styles.cell}>{doc.data ? new Date(doc.data).toLocaleDateString('pt-BR') : '—'}</td>
            <td className={styles.cell}>
                <span className={`${styles.status_badge} ${styles[s.className]}`}>
                    {s.label}
                </span>
            </td>
            <td className={styles.cell_actions}>
                <button className={styles.sign_button} onClick={() => onDownload(doc)} title="Baixar arquivo">
                    <FiDownload className={styles.sign_icon} />
                    Baixar
                </button>
            </td>
        </tr>
    );
};

const DocumentList = ({ documents = [], search = '', onSearchChange, onDownload, page = 1, pages = 1, onPage, loading = false }) => {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Todos os Documentos</h2>

            <div className={styles.toolbar}>
                <div className={styles.search_wrapper}>
                    <FiSearch className={styles.search_icon} />
                    <input
                        className={styles.search_input}
                        placeholder="Buscar documentos..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr className={styles.header_row}>
                        <th className={styles.header_cell}>Nome</th>
                        <th className={styles.header_cell}>Cliente</th>
                        <th className={styles.header_cell}>Tipo</th>
                        <th className={styles.header_cell}>Data</th>
                        <th className={styles.header_cell}>Status</th>
                        <th className={styles.header_cell}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map((doc) => (
                        <DocumentRow key={doc.id} doc={doc} onDownload={onDownload} />
                    ))}
                    {!loading && documents.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>Nenhum documento encontrado. Envie o primeiro acima.</td></tr>
                    )}
                </tbody>
            </table>

            {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', padding: 12 }}>
                    <button disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</button>
                    <span>Página {page} de {pages}</span>
                    <button disabled={page >= pages} onClick={() => onPage(page + 1)}>Próxima</button>
                </div>
            )}
        </div>
    );
};

export default DocumentList;
