import styles from './BackButton.module.css';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ label, to }) => {
    const navigate = useNavigate();

    return (
        <button className={styles.button} onClick={() => navigate(to)}>
            <FiArrowLeft className={styles.icon} />
            {label}
        </button>
    );
};

export default BackButton;