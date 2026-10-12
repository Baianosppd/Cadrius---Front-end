import styles from './RegisterHeader.module.css';
import BrandLogo from '../brand/BrandLogo';

const RegisterHeader = () => {
    return (
        <div className={styles.header}>
            <span className={styles.logo}><BrandLogo size={28} /></span>
        </div>
    );
};

export default RegisterHeader;