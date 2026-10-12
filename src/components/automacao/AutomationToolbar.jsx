import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { Button, Field, FilterBar, Input } from '../ui';

// Busca e criação de fluxos com apps externos
const AutomationToolbar = ({ search, onSearchChange }) => (
    <FilterBar>
        <Field label="Buscar"><Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Nome da automação" /></Field>
        <Button as={Link} to="/editor" variant="primary" icon={FiPlus}>Criar nova automação</Button>
    </FilterBar>
);

export default AutomationToolbar;
