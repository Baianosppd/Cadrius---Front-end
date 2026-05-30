import styles from './RegisterLayout.module.css';
import { Outlet } from 'react-router-dom';

const RegisterLayout = () => {
    return (
        <div className={styles.container}>
            <Outlet />
        </div>
    );
};

export default RegisterLayout;