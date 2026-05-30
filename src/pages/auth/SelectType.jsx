import { useNavigate } from 'react-router-dom';
import styles from './SelectType.module.css';
import RegisterHeader from '../../components/common/RegisterHeader';
import BackButton from '../../components/common/BackButton';
import { FiUser, FiGrid } from 'react-icons/fi';

const TypeCard = ({ icon: Icon, title, description, features, color, bg, onClick }) => (
    <div className={styles.card} onClick={onClick}>
        <div className={styles.card_icon} style={{ backgroundColor: bg }}>
            <Icon style={{ color, width: 32, height: 32 }} />
        </div>
        <h3 className={styles.card_title}>{title}</h3>
        <p className={styles.card_description}>{description}</p>
        <ul className={styles.features}>
            {features.map((f, i) => (
                <li key={i} className={styles.feature_item}>
                    <span className={styles.feature_dot} />
                    {f}
                </li>
            ))}
        </ul>
    </div>
);

function SelectType() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <RegisterHeader />
            <div className={styles.content}>
                <div className={styles.back_wrapper}>
                    <BackButton label="Voltar para Login" to="/" />
                </div>
                <h1 className={styles.title}>Bem-vindo ao Cadrius</h1>
                <p className={styles.subtitle}>Como você deseja utilizar o Cadrius?</p>

                <div className={styles.cards}>
                    <TypeCard
                        icon={FiUser}
                        title="Advogado Autônomo"
                        description="Para profissionais independentes que buscam automatizar sua prática jurídica"
                        features={['Conta individual', 'Gestão simplificada', 'Análise de documentos com IA']}
                        color="#3b82f6"
                        bg="#eff6ff"
                        onClick={() => navigate('/cadastro/individual')}
                    />
                    <TypeCard
                        icon={FiGrid}
                        title="Escritório / Empresa"
                        description="Para equipes e escritórios que precisam de gestão centralizada"
                        features={['Múltiplos usuários', 'Controle de permissões', 'Gestão de equipe completa']}
                        color="#8b5cf6"
                        bg="#f5f3ff"
                        onClick={() => navigate('/cadastro/empresa')}
                    />
                </div>
            </div>
        </div>
    );
}

export default SelectType;