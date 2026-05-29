import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import styles from './SignatureModal.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const SuccessScreen = () => (
    <div className={styles.success_screen}>
        <div className={styles.success_icon_wrapper}>
            <FiCheckCircle className={styles.success_icon} />
        </div>
        <h2 className={styles.success_title}>Documento Assinado com Sucesso!</h2>
        <p className={styles.success_subtitle}>O documento foi assinado digitalmente e está sendo processado.</p>
        <p className={styles.success_redirect}>Redirecionando...</p>
    </div>
);

const SignatureModal = ({ doc, onClose }) => {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [signed, setSigned] = useState(false);

    const handleSign = () => {
        setSigned(true);
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    const now = new Date();
    const dateTime = now.toLocaleDateString('pt-BR') + ', ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {signed ? (
                    <SuccessScreen />
                ) : (
                    <>
                        <div className={styles.header}>
                            <div>
                                <p className={styles.header_title}>Cadrius</p>
                                <p className={styles.header_subtitle}>Assinatura Digital</p>
                            </div>
                            <button className={styles.close_button} onClick={onClose}>
                                <FiX className={styles.close_icon} />
                            </button>
                        </div>

                        <div className={styles.content}>
                            <h2 className={styles.doc_title}>{doc?.name || 'Documento'}</h2>
                            <p className={styles.doc_type}>{doc?.type || ''}</p>

                            <div className={styles.viewer_wrapper}>
                                <Document
                                    file={doc?.fileUrl || null}
                                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                    loading={<p className={styles.loading}>Carregando documento...</p>}
                                    error={<p className={styles.loading}>Visualização disponível após integração com o servidor.</p>}
                                >
                                    <Page pageNumber={currentPage} width={700} />
                                </Document>

                                {currentPage === numPages && (
                                    <div className={styles.signature_block}>
                                        <div className={styles.signature_header}>
                                            <div>
                                                <h3 className={styles.signature_title}>Assinatura Digital Cadrius</h3>
                                            </div>
                                            <button className={styles.verified_badge}>
                                                <FiCheckCircle className={styles.verified_icon} />
                                                Cadrius Verified
                                            </button>
                                        </div>
                                        <div className={styles.signature_grid}>
                                            <div className={styles.signature_field}>
                                                <span className={styles.field_label}>Assinante</span>
                                                <p className={styles.field_value}>{doc?.signer || 'João da Silva'}</p>
                                            </div>
                                            <div className={styles.signature_field}>
                                                <span className={styles.field_label}>Data e Hora</span>
                                                <p className={styles.field_value}>{dateTime}</p>
                                            </div>
                                            <div className={styles.signature_field}>
                                                <span className={styles.field_label}>Endereço IP</span>
                                                <p className={styles.field_value}>192.168.1.100</p>
                                            </div>
                                            <div className={styles.signature_field}>
                                                <span className={styles.field_label}>Hash do Documento</span>
                                                <p className={styles.field_value}>a3f9b2c1e4d5...</p>
                                            </div>
                                        </div>
                                        <p className={styles.signature_note}>
                                            Este documento foi assinado digitalmente através da plataforma Cadrius. A autenticidade pode ser verificada através do código de verificação acima.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className={styles.pagination}>
                                <button
                                    className={styles.page_button}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage <= 1}
                                >
                                    Anterior
                                </button>
                                <span className={styles.page_info}>Página {currentPage} de {numPages || '—'}</span>
                                <button
                                    className={styles.page_button}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, numPages))}
                                    disabled={currentPage >= numPages}
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>

                        <div className={styles.footer}>
                            <button className={styles.sign_button} onClick={handleSign}>
                                <FiCheckCircle className={styles.sign_icon} />
                                Confirmar Assinatura Digital
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        window.document.body
    );
};

export default SignatureModal;