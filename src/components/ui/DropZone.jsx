import styles from './DropZone.module.css';
import { FiUpload } from 'react-icons/fi';

const DropZone = ({ onFileSelect }) => {
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (onFileSelect) onFileSelect(files);
    };

    const handleInputChange = (e) => {
        if (onFileSelect) onFileSelect(e.target.files);
    };

    return (
        <div
            className={styles.dropzone}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className={styles.icon_wrapper}>
                <FiUpload className={styles.icon} />
            </div>
            <h3 className={styles.title}>Arraste e solte seus arquivos aqui</h3>
            <p className={styles.subtitle}>ou clique no botão abaixo para selecionar</p>

            <label className={styles.button}>
                <FiUpload className={styles.button_icon} />
                Selecionar Arquivos
                <input
                    type="file"
                    className={styles.hidden_input}
                    accept=".pdf,.doc,.docx"
                    multiple
                    onChange={handleInputChange}
                />
            </label>

            <span className={styles.formats}>Formatos aceitos: PDF, DOC, DOCX (Máx. 10MB)</span>
        </div>
    );
};

export default DropZone;