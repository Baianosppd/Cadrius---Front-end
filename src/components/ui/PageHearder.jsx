// Cabeçalho de página antigo: agora usa o cabeçalho padrão (CAD-219), para todas as telas ficarem iguais
import { PageHeader as SharedPageHeader } from '../seguranca/ui';

const PageHeader = ({ title, subtitle, actions }) => <SharedPageHeader title={title} subtitle={subtitle} actions={actions} />;

export default PageHeader;
