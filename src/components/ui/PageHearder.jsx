// Cabeçalho de página antigo: agora usa o cabeçalho padrão (CAD-219), para todas as telas ficarem iguais
import SharedPageHeader from './PageHeader';

const PageHeader = ({ title, subtitle, actions }) => <SharedPageHeader title={title} subtitle={subtitle} actions={actions} />;

export default PageHeader;
