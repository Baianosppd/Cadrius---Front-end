# Cadrius — Pendências Encontradas na Reconexão Front↔Back

Lista viva de bugs/ajustes de backend descobertos enquanto reconectamos telas
do frontend que já tinham endpoint pronto, mas com algo errado no meio do
caminho (campo errado, ID errado, validação faltando, etc.). Diferente do
`ROTAS_PARA_O_BACKEND.md`, que lista rotas que ainda **não existem** — aqui são
rotas que já existem, mas precisam de um ajuste.

Formato de cada item: onde está, o que está errado, e a correção sugerida.

---

### BUG-01 — Descrição da tarefa não volta na listagem

**Local:** `tasks/serializers.py`, classe `UserTaskListSerializer`.

**Contexto:** Ao criar uma tarefa em `POST /api/v1/tasks/`, o campo `descricao`
é salvo normalmente. Mas `GET /api/v1/tasks/` (usado pelo card "Tarefas de Hoje"
do Dashboard) devolve o campo `description` como um alias do `titulo`:

```python
description = serializers.CharField(source='titulo', read_only=True)
```

Ou seja, o texto que o usuário digitou como descrição nunca aparece — o card
mostra o título duplicado no lugar.

**Correção sugerida:** trocar `source='titulo'` por `source='descricao'`.

---

### ~~BUG-02~~ — RESOLVIDO (02/10/2026)

O endpoint `GET /api/v1/funcionarios/` (criado na branch `integration-front-back`)
já devolve `user_id` de verdade. O dropdown "Responsável" em `TaskForm.jsx` foi
atualizado pra usar `/funcionarios/` em vez de `/teams/members/`, e está
destravado — qualquer membro pode ser selecionado agora.

<details>
<summary>Descrição original do bug</summary>

### BUG-02 — `/teams/members/` não expõe o ID real do usuário

**Local:** `accounts/serializers.py`, classe `TeamMemberSerializer`.

**Contexto:** O campo `id` devolvido por `GET /api/v1/teams/members/` é o ID do
`OrganizationMembership` (o vínculo da pessoa com o escritório), não o ID do
`CustomUser`. Isso impede o frontend de popular corretamente o dropdown
"Responsável" na tela de Nova Tarefa — `UserTask.responsavel` é uma FK para
`CustomUser`, então mandar o ID do vínculo dá erro 400 ("Pk inválido... objeto
não existe").

Por enquanto, o frontend travou esse dropdown pra só permitir atribuir tarefas
a si mesmo (ver `TaskForm.jsx`, campo Responsável) até esse campo existir.

**Correção sugerida:** adicionar um campo `user_id` ao `TeamMemberSerializer`,
por exemplo:
```python
user_id = serializers.CharField(source='user.id', read_only=True)
```
(ajustar o tipo do campo — `CharField`/`UUIDField` — conforme o tipo real do
`id` de `CustomUser`.)

**O que o frontend fará quando isso existir:** em `TaskForm.jsx`, remover o
`disabled` do `<select>` de Responsável e usar `member.user_id` (em vez de
`member.id`) como `value` de cada `<option>` — o bloco já está escrito e
comentado no código, esperando essa mudança.

</details>

---

### BUG-03 — Foto de perfil não é salva

**Local:** `accounts/serializers.py`, classe `UserProfileUpdateSerializer`.

**Contexto:** `Perfil.jsx` envia `profile_picture` via multipart para
`PATCH /api/v1/auth/profile/`. O model `CustomUser` tem o campo
`profile_picture`, mas `UserProfileUpdateSerializer.Meta.fields` só lista
`['first_name', 'last_name', 'phone', 'oab_number']` — o DRF descarta o campo
silenciosamente. O front mostra "Foto atualizada com sucesso!" mesmo sem nada
ser salvo.

**Correção sugerida:** adicionar `'profile_picture'` à lista de `fields` em
`UserProfileUpdateSerializer`.

---

*Iniciado em 27/09/2026 durante auditoria de reconexão front↔back do Dashboard.*
