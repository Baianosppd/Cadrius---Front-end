import styles from './DocumentList.module.css';
import { FiSearch, FiFilter, FiFile, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';
import SignatureModal from '../common/SignatureModal';

const statusConfig = {
    concluido: { label: 'Concluído', className: 'status_concluido' },
    processando: { label: 'Processando', className: 'status_processando' },
    erro: { label: 'Erro', className: 'status_erro' },
};

const DocumentRow = ({ name, client, type, date, status, onSign, onDelete }) => {
    const s = statusConfig[status];
    const [menuOpen, setMenuOpen] = useState(false);

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
                <button className={styles.sign_button} onClick={onSign}>
                    <FiEdit2 className={styles.sign_icon} />
                    Assinar
                </button>
            </td>
            <td className={styles.cell}>
                <span className={`${styles.status_badge} ${styles[s.className]}`}>
                    {s.label}
                </span>
            </td>
            <td className={styles.cell_actions}>
                <div className={styles.menu_wrapper}>
                    <button
                        className={styles.menu_button}
                        onClick={() => setMenuOpen(p => !p)}
                    >
                        <FiMoreVertical />
                    </button>
                    {menuOpen && (
                        <div className={styles.dropdown}>
                            <button
                                className={styles.dropdown_item_danger}
                                onClick={() => { onDelete(); setMenuOpen(false); }}
                            >
                                <FiTrash2 className={styles.dropdown_icon} />
                                Excluir Documento
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

const DocumentList = ({ documents = [] }) => {
    const [search, setSearch] = useState('');
    const [signingDoc, setSigningDoc] = useState(null);

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
                        <th className={styles.header_cell}>Assinar</th>
                        <th className={styles.header_cell}>Status</th>
                        <th className={styles.header_cell}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((doc, index) => (
                        <DocumentRow
                            key={index}
                            {...doc}
                            onSign={() => setSigningDoc(doc)}
                            onDelete={() => console.log('excluir', doc.name)}
                        />
                    ))}
                </tbody>
            </table>

            {signingDoc && (
                <SignatureModal
                    document={signingDoc}
                    onClose={() => setSigningDoc(null)}
                />
)}
        </div>
    );
};

export default DocumentList;