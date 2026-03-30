// src/components/layout/Footer.js
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import styles from './Footer.module.css';

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>

                {/* Coluna 1: Identidade */}
                <div className={styles.column}>
                    <h3 className={styles.brand}>Cadrius AI</h3>
                    <p className={styles.tagline}>
                        Automação jurídica inteligente para escritórios modernos.
                    </p>
                </div>

                {/* Coluna 2: Links Rápidos */}
                <div className={styles.column}>
                    <h4 className={styles.heading}>Produto</h4>
                    <ul className={styles.link_list}>
                        <li><a href="#">Funcionalidades</a></li>
                        <li><a href="#">Integrações</a></li>
                        <li><a href="#">Preços</a></li>
                    </ul>
                </div>

                {/* Coluna 3: Suporte */}
                <div className={styles.column}>
                    <h4 className={styles.heading}>Suporte</h4>
                    <ul className={styles.link_list}>
                        <li><a href="#">Central de Ajuda</a></li>
                        <li><a href="#">Termos de Uso</a></li>
                        <li><a href="#">Privacidade</a></li>
                    </ul>
                </div>

                {/* Coluna 4: Redes Sociais */}
                <div className={styles.column}>
                    <h4 className={styles.heading}>Conecte-se</h4>
                    <ul className={styles.social_list}>
                        <li><a href="#"><FaLinkedin /></a></li>
                        <li><a href="#"><FaInstagram /></a></li>
                        <li><a href="#"><FaFacebook /></a></li>
                        <li><a href="#"><FaTwitter /></a></li>
                    </ul>
                </div>
            </div>

            <div className={styles.bottom_bar}>
                <p className={styles.copy_right}>
                    &copy; {new Date().getFullYear()} Cadrius Tecnologia Jurídica. Todos os direitos reservados.
                </p>
            </div>
        </footer>
    );
}

export default Footer;