# Cadrius — Levantamento de Rotas para o Backend

Documento gerado após revisão completa da integração entre frontend e backend.
Baseado no documento de rotas fornecido pelo time de backend.

---

## Lista 1 — Rotas Legado / Em Pausa

Estas rotas já existem no backend e já têm componentes prontos no frontend,
mas estão desconectadas da UI por decisão de produto (em pausa por enquanto).
Quando forem ativadas, o frontend precisará apenas reconectar os modais/páginas.

---

### 3 — Caixas de E-mail IMAP (`/api/v1/mailboxes/`)

**O que é:** Funcionalidade para o usuário conectar uma caixa de e-mail via IMAP
(ex: Gmail, Outlook) para o sistema capturar e-mails automaticamente.

**Estado atual no frontend:**
- O componente `MailboxModal.jsx` já existe e já chama `POST /api/v1/mailboxes/` corretamente.
- O modal está importado mas comentado em `Integracoes.jsx`.
- Não há listagem, edição ou exclusão de caixas cadastradas na UI.

**O que precisará ser feito quando ativar:**
- Descomentar o modal em `Integracoes.jsx` e conectar ao botão do card Gmail.
- Implementar `GET /api/v1/mailboxes/` para listar as caixas cadastradas.
- Implementar `DELETE /api/v1/mailboxes/{id}/` para o usuário remover uma caixa.

---

### 4 — E-mails Capturados (`/api/v1/emails/`)

**O que é:** Visualização dos e-mails que o sistema capturou das caixas IMAP conectadas.

**Estado atual no frontend:**
- As páginas `Processos.jsx` e `Comunicacao.jsx` faziam essa integração, mas foram
  descontinuadas — são páginas legado que não estão mais no fluxo de navegação.
- Será necessário criar novas telas para essa funcionalidade quando for reativada.

**O que precisará ser feito quando ativar:**
- Criar nova página ou seção dedicada para visualização dos e-mails capturados.
- Usar `GET /api/v1/emails/?q=` para listagem com busca.
- Usar `GET /api/v1/emails/{id}/` para visualizar o corpo completo de um e-mail.

---

### 5 — Perfis de Extração de IA (`/api/v1/extraction-profiles/`)

**O que é:** Permite ao usuário criar perfis de prompt customizados para a IA
extrair informações específicas dos documentos (ex: prazos, partes, valores).

**Estado atual no frontend:**
- O componente `AIProfileModal.jsx` já existe e já chama `POST /api/v1/extraction-profiles/` corretamente.
- O modal está importado mas comentado em `Integracoes.jsx`.
- Os schemas disponíveis estão hardcoded no modal:
  `ProcessoJuridicoSchema`, `ServiceOrderSchema`, `SupportRequestSchema`.

**O que precisará ser feito quando ativar:**
- Descomentar e conectar o modal à UI de Integrações.
- Implementar `GET /api/v1/extraction-profiles/` para listar os perfis criados.
- Implementar `DELETE /api/v1/extraction-profiles/{id}/` para exclusão.
- Confirmar se os nomes de schema hardcoded no frontend (`ProcessoJuridicoSchema`,
  `ServiceOrderSchema`, `SupportRequestSchema`) ainda batem com o que o backend aceita.

---

### 6 — Workflows e Automações (`/api/v1/workflows/`)

**O que é:** O editor visual de fluxos de automação (FlowEditor) onde o usuário
monta automações arrastando nós de trigger e action.

**Estado atual no frontend:**
- O `FlowEditor.jsx` existe e está funcional visualmente (React Flow).
- **Problema crítico:** O frontend está enviando para `/automacoes/fluxos/` que
  não existe no backend. O endpoint correto é `POST /api/v1/workflows/`.
- **Problema de formato:** O frontend envia `{ nodes[], edges[] }` (formato React Flow),
  mas o backend espera `{ trigger{}, actions[] }` (formato semântico).

**O que precisa ser alinhado com o backend antes de implementar:**
1. Qual a estrutura exata do objeto `trigger`? Quais campos? Quais valores aceitos para `event_type`?
2. Qual a estrutura de cada item em `actions[]`? Quais campos? Quais `action_type` existem?
3. Como mapear os `subtype` do frontend (`whatsapp`, `email`, `webhook`, `agendamento`, etc.)
   para os valores que o backend aceita?
4. O backend precisa salvar a posição visual dos nós (x, y) para recarregar o canvas depois?
   Se sim, precisa de campos extras no modelo. Se não, o frontend descarta as coordenadas ao salvar.
5. `GET /api/v1/workflows/` retorna em qual formato? O frontend precisará converter de volta
   para `{ nodes[], edges[] }` ao carregar um fluxo salvo.

---

## Lista 2 — Rotas que Precisam ser Criadas no Backend

Estas rotas **não existem ainda** no backend. O frontend precisa delas para
substituir dados hardcoded e habilitar funcionalidades que hoje não funcionam.

---

### AUTH-01 — Atualização de Perfil

**Rota sugerida:** `PATCH /api/v1/auth/profile/`

**Contexto:** A rota `GET /api/v1/auth/user/` é somente leitura (conforme documentado).
Porém, a tela de Perfil (`Perfil.jsx`) precisa salvar alterações feitas pelo usuário.

**Campos que o frontend vai enviar:**
```json
{
  "first_name": "João",
  "last_name": "Silva",
  "phone": "(11) 99999-9999",
  "oab_number": "SP 123456"
}
```

**Para upload de foto de perfil** (multipart/form-data):
```
profile_picture: <arquivo de imagem>
```

**Resposta esperada:** Objeto do usuário atualizado (mesmo formato do `GET /api/v1/auth/user/`).

---

### AUTH-02 — Troca de Senha

**Rota sugerida:** `POST /api/v1/auth/change-password/`

**Contexto:** A tela de Perfil tem um formulário de troca de senha que hoje não chama
nenhuma API (apenas faz `console.log`).

**Campos que o frontend vai enviar:**
```json
{
  "current_password": "senha_atual",
  "new_password": "nova_senha",
  "confirm_password": "nova_senha"
}
```

**Resposta esperada:** `{ "message": "Senha alterada com sucesso." }` ou erro 400 com detalhe.

---

### TASKS-01 — Tarefas do Dashboard

**Rota sugerida:** `GET /api/v1/tasks/` e `POST /api/v1/tasks/`

**Contexto:** O Dashboard exibe uma lista de tarefas do dia com horário e prioridade.
Hoje são 4 itens hardcoded. A página `NewTask.jsx` tem um formulário completo que
ao submeter apenas faz `console.log` — nunca salva nada.

**Campos que o frontend vai enviar no POST:**
```json
{
  "titulo": "Responder petição",
  "descricao": "Descrição da tarefa",
  "dataHorario": "2025-06-10T09:00",
  "prioridade": "alta",
  "responsavel": "uuid-do-usuario",
  "sincronizar": false
}
```

**Resposta esperada do GET:** Lista de tarefas com pelo menos:
```json
[
  {
    "id": 1,
    "description": "...",
    "time": "09:00",
    "priority": "alta",
    "completed": false
  }
]
```

---

### TASKS-02 — Marcar Tarefa como Concluída

**Rota sugerida:** `PATCH /api/v1/tasks/{id}/`

**Contexto:** No Dashboard há um checkbox por tarefa. Hoje o toggle só muda o estado
local (não persiste). Precisa de um endpoint para atualizar `completed: true/false`.

**Campos que o frontend vai enviar:**
```json
{ "completed": true }
```

---

### ACTIVITY-01 — Atividades Recentes

**Rota sugerida:** `GET /api/v1/activities/`

**Contexto:** O Dashboard exibe um feed de atividades recentes do sistema
(documentos analisados, prazos identificados, automações executadas, erros).
Hoje são 4 itens hardcoded.

**Resposta esperada:**
```json
[
  {
    "title": "Documento analisado com sucesso",
    "description": "Petição Inicial foi processada.",
    "time": "Há 20 minutos",
    "type": "success"
  }
]
```
`type` aceita: `"success"`, `"warning"`, `"error"`.

---

### BILLING-01 — Planos Disponíveis

**Rota sugerida:** `GET /api/billing/plans/`

**Contexto:** A tela de Perfil exibe o plano atual do usuário e outros planos disponíveis
para upgrade. Hoje os planos estão hardcoded com IDs em string
(`'starter'`, `'professional'`, `'enterprise'`), mas o endpoint de checkout
espera um `plan_id` numérico.

**Resposta esperada:**
```json
[
  {
    "id": 1,
    "name": "Starter",
    "price": "Grátis",
    "description": "Limite de 10 documentos/mês",
    "features": []
  },
  {
    "id": 2,
    "name": "Professional",
    "price": "R$ 99",
    "description": "",
    "features": ["1.000 créditos", "Gestão de Tarefas", "Até 3 usuários", "Integrações premium"]
  }
]
```

---

### BILLING-02 — Checkout Stripe

**Rota:** `POST /api/billing/checkout/` *(já existe no documento, mas bloqueada pelo BILLING-01)*

**Contexto:** O botão "Gerenciar Assinatura" em `Perfil.jsx` está vazio (`() => {}`).
Para funcionar, o frontend precisa primeiro dos IDs numéricos reais dos planos
(ver BILLING-01 acima) para enviar no body.

**Funcionamento após BILLING-01 resolvido:**
```js
// Frontend vai fazer:
const res = await api.post('/api/billing/checkout/', { plan_id: 2 });
window.location.href = res.data.checkout_url;
```

---

### DOCS-01 — Listagem de Documentos

**Rota sugerida:** `GET /api/v1/documents/`

**Contexto:** A página `Documents.jsx` exibe uma lista de documentos com nome, cliente,
tipo, data e status. Hoje são 5 itens hardcoded. Também há um `DropZone` para upload
que não está conectado a nenhuma API.

**Resposta esperada:**
```json
[
  {
    "id": 1,
    "name": "Petição Inicial - Caso Silva",
    "client": "João Silva",
    "type": "Petição",
    "date": "2024-05-15",
    "status": "concluido"
  }
]
```
`status` aceita: `"concluido"`, `"processando"`, `"erro"`.

---

### DOCS-02 — Upload de Documento

**Rota sugerida:** `POST /api/v1/documents/` (multipart/form-data)

**Contexto:** O `DropZone.jsx` permite arrastar/selecionar arquivos mas não envia
nada para o backend hoje.

**O frontend vai enviar:**
```
file: <arquivo PDF ou similar>
```

---

### DOCS-03 — Detalhe de Documento

**Rota sugerida:** `GET /api/v1/documents/{id}/`

**Contexto:** A página `DocumentDetail.jsx` exibe análise completa de um documento:
resumo, partes, prazos e cláusulas. Tudo está hardcoded. Também não recebe um ID
via parâmetro de rota — a rota `/documentdetail` precisará virar `/documentdetail/:id`.

**Resposta esperada:**
```json
{
  "id": 1,
  "name": "Petição Inicial - Caso Silva",
  "date": "15/05/2024",
  "size": "2.4 MB",
  "type": "Petição",
  "fileUrl": "https://...",
  "summary": "Este documento trata de...",
  "parties": [
    { "role": "Autor", "name": "João Silva", "document": "CPF: 123.456.789-00" }
  ],
  "deadlines": [
    { "label": "Prazo para contestação", "days": 15 }
  ],
  "clauses": [
    { "title": "Cláusula de Juros", "description": "...", "priority": "Alta" }
  ]
}
```

---

### TEAM-01 — Convidar Funcionário

**Rota sugerida:** `POST /api/v1/teams/members/`

**Contexto:** A tela de Gestão de Equipe (`GestaoEquipe.jsx`) tem um modal para
convidar novos funcionários, mas o `api.post` está comentado. O `GET /api/v1/teams/members/`
já funciona para listar membros.

**Campos que o frontend vai enviar:**
```json
{
  "email": "funcionario@empresa.com",
  "role": "advogado_pleno"
}
```

---

### TEAM-02 — Grupos de Permissão

**Rota sugerida:** `GET /api/v1/teams/permission-groups/`

**Contexto:** A aba "Grupos de Permissão" em `GestaoEquipe.jsx` exibe 3 grupos
hardcoded (Admin, Advogado Pleno, Estagiário) com suas permissões.

**Resposta esperada:**
```json
[
  {
    "name": "Admin",
    "description": "Acesso total ao sistema",
    "permissions": ["Ver documentos", "Criar documentos", "Deletar documentos", ...]
  }
]
```

---

### NOTIF-01 — Notificações

**Rota sugerida:** `GET /api/v1/notifications/`

**Contexto:** A página `Notificacoes.jsx` exibe um feed de notificações do sistema.
Hoje são 5 itens hardcoded com título, descrição, tempo, tipo e se foi lida.

**Resposta esperada:**
```json
[
  {
    "id": 1,
    "title": "Documento analisado com sucesso",
    "description": "Petição Inicial foi processada e os prazos foram extraídos.",
    "time": "Há 20 minutos",
    "read": false,
    "type": "documento",
    "origem": "Módulo de Documentos",
    "documento": "Petição Inicial - Caso Silva.pdf",
    "acao": "Análise concluída com sucesso",
    "detalhes": "Foram extraídos 3 prazos importantes.",
    "actionLabel": "Ir para Módulo de Documentos",
    "link": "/documentos"
  }
]
```

---

### INTEG-01 — Status das Integrações

**Rota sugerida:** `GET /api/v1/integrations/status/`

**Contexto:** A página `Integracoes.jsx` exibe cards com o status de cada integração
(conectado/desconectado) e um histórico de sincronizações. Tudo hardcoded.

**Resposta esperada:**
```json
{
  "integrations": [
    {
      "name": "Gmail",
      "status": "conectado",
      "syncInfo": "13 min atrás - 12 novos e-mails processados"
    }
  ],
  "history": [
    {
      "name": "OpenAI",
      "description": "45 documentos analisados",
      "time": "3 min atrás",
      "status": "sucesso"
    }
  ]
}
```

---

*Documento gerado em 10/06/2026 — Cadrius Frontend Team*
