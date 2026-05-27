import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import styles from './DocumentViewer.module.css';
import { FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from 'react-icons/fi';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const DocumentViewer = ({ fileUrl }) => {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const goToPrev = () => setCurrentPage(p => Math.max(p - 1, 1));
    const goToNext = () => setCurrentPage(p => Math.min(p + 1, numPages));
    const zoomIn = () => setZoom(p => Math.min(p + 0.1, 2));
    const zoomOut = () => setZoom(p => Math.max(p - 0.1, 0.5));

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <span className={styles.toolbar_title}>Visualizador de Documento</span>
                <div className={styles.toolbar_controls}>
                    <button className={styles.control_button} onClick={goToPrev} disabled={currentPage <= 1}>
                        <FiChevronLeft />
                    </button>
                    <span className={styles.page_info}>{currentPage} / {numPages || '—'}</span>
                    <button className={styles.control_button} onClick={goToNext} disabled={currentPage >= numPages}>
                        <FiChevronRight />
                    </button>
                    <button className={styles.control_button} onClick={zoomOut}>
                        <FiZoomOut />
                    </button>
                    <span className={styles.zoom_info}>{Math.round(zoom * 100)}%</span>
                    <button className={styles.control_button} onClick={zoomIn}>
                        <FiZoomIn />
                    </button>
                </div>
            </div>

            <div className={styles.viewer}>
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<p className={styles.loading}>Carregando documento...</p>}
                    error={<p className={styles.error}>Não foi possível carregar o documento.</p>}
                >
                    <Page
                        pageNumber={currentPage}
                        scale={zoom}
                        loading={<p className={styles.loading}>Carregando página...</p>}
                    />
                </Document>
            </div>
        </div>
    );
};

export default DocumentViewer;