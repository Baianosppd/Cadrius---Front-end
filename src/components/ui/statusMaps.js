// Mapas de estado → rótulo/cor, compartilhados entre as telas (usados com <StatusPill>)
export const SEVERITY = {
    critical: { label: 'Crítica', tone: 'red' }, high: { label: 'Alta', tone: 'orange' },
    medium: { label: 'Média', tone: 'yellow' }, low: { label: 'Baixa', tone: 'blue' },
};
export const ALERT_STATUS = {
    open: { label: 'Aberto', tone: 'red' }, ack: { label: 'Em análise', tone: 'yellow' },
    resolved: { label: 'Resolvido', tone: 'green' }, false_positive: { label: 'Falso positivo', tone: 'gray' },
};
export const OUTCOME = {
    success: { label: 'Sucesso', tone: 'green' }, denied: { label: 'Negado', tone: 'orange' },
    error: { label: 'Erro', tone: 'red' },
};
export const CONTROL_STATUS = {
    implemented: { label: 'Implementado', tone: 'green' }, partial: { label: 'Parcial', tone: 'yellow' },
    not_implemented: { label: 'Não implementado', tone: 'red' }, not_applicable: { label: 'Não aplicável', tone: 'gray' },
    not_assessed: { label: 'Não avaliado', tone: 'gray' },
};
export const CHECK_STATUS = {
    pass: { label: 'OK', tone: 'green' }, partial: { label: 'Parcial', tone: 'yellow' },
    fail: { label: 'Falha', tone: 'red' }, unknown: { label: 'Desconhecido', tone: 'gray' },
};
