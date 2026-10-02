# Cadrius — Pendências de Design

Lista viva de telas/componentes que precisam de um design antes de serem
implementados — o endpoint já existe no backend, mas não tem mockup/layout
pronto no Figma (ou onde quer que o design esteja) pra guiar a implementação.

---

### DESIGN-01 — Crédito geral do escritório (tela de Equipe)

**Endpoint já pronto:** `GET /api/v1/teams/credits/`, devolve:
```json
{
  "creditos_total": 0,
  "creditos_usados": 0,
  "creditos_disponiveis": 0,
  "creditos_distribuidos": 0,
  "creditos_nao_distribuidos": 0
}
```

**Contexto:** A tela de Gestão de Equipe (`GestaoEquipe.jsx`) só mostra crédito
individual por membro hoje (já conectado). Falta um bloco mostrando o resumo
geral do escritório com esses 5 números. Não existe nenhum layout pronto pra
isso ainda — precisa pedir um design (provavelmente um conjunto de cards de
resumo, parecido com os cards do Dashboard, mas não necessariamente).

**Status:** aguardando design.

---

*Iniciado em 02/10/2026.*
