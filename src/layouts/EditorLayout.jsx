import styles from './EditorLayout.module.css';
import { Outlet } from 'react-router-dom';

const EditorLayout = () => {
    return (
        <div className={styles.container}>
            <Outlet />
        </div>
    );
};

export default EditorLayout;