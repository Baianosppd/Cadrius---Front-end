import styles from './DocumentList.module.css';
import { FiSearch, FiFilter, FiFile } from 'react-icons/fi';
import { useState } from 'react';

const statusConfig = {
    concluido: { label: 'Concluído', className: 'status_concluido' },
    processando: { label: 'Processando', className: 'status_processando' },
    erro: { label: 'Erro', className: 'status_erro' },
};

const DocumentRow = ({ name, client, type, date, status }) => {
    const s = statusConfig[status];
    return (
        <tr className={styles.row}>
            <td className={styles.cell_name}>
                <FiFile className={styles.file_icon} />
                {name}
            </td>
            <td className={styles.cell}>{client}</td>
            <td className={styles.cell}>
                <span className={styles.type_badge}>{type}</span>
            </td>
            <td className={styles.cell}>{date}</td>
            <td className={styles.cell}>
                <span className={`${styles.status_badge} ${styles[s.className]}`}>
                    {s.label}
                </span>
            </td>
        </tr>
    );
};

const DocumentList = ({ documents = [] }) => {
    const [search, setSearch] = useState('');

    const filtered = documents.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

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
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className={styles.filter_button}>
                    <FiFilter className={styles.filter_icon} />
                    Filtros
                </button>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr className={styles.header_row}>
                        <th className={styles.header_cell}>Nome</th>
                        <th className={styles.header_cell}>Cliente</th>
                        <th className={styles.header_cell}>Tipo</th>
                        <th className={styles.header_cell}>Data</th>
                        <th className={styles.header_cell}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((doc, index) => (
                        <DocumentRow key={index} {...doc} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DocumentList;