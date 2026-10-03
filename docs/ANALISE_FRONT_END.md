# Análise do front-end (2026-10) — pontos falhos, o que foi corrigido e o que falta

Escopo: repositório `Cadrius---Front-end` (React 19 + Vite 8) contra o back-end Cadrius (Django/DRF). Baseline analisado: `main` @ `aad3b0f`.
Método: leitura do código, comparação de **todas** as chamadas de API com as rotas reais do Django, build/lint/audit, e execução ponta a ponta com navegador (Playwright) contra o back real.

## 1. Resumo executivo

| Área | Antes | Depois (branches `CAD-106`…`CAD-112`) |
|---|---|---|
| Docker/deploy | Dockerfile rodava `npm start` (script inexistente) e servia o servidor de **desenvolvimento**; `.env` versionado; `npm ci` quebrado (lockfile fora de sincronia); deploy com caminhos e segredos fixos | Imagem multi-stage (build → nginx sem privilégios, porta 8080, CSP, `/healthz`), compose de dev com hot reload, `.env` fora do git, lockfile sincronizado, CI + deploy de teste (`Develop`) e produção (`main`) por SSH com host verificado |
| Dependências | 4 vulnerabilidades altas (axios, form-data, react-router…) | 0 vulnerabilidades (`npm audit`), Dependabot |
| Qualidade | ESLint desligado no CI, 33 erros | ESLint sem erros (22 avisos), 13 testes unitários no CI |
| Cadastro | Contrato antigo (quebrava com o back novo), cartão digitado em formulário nosso, não entrava logado, sem aceite LGPD | Contrato novo + aceite LGPD versionado, planos reais, pagamento no Stripe Checkout, entra logado |
| Telas "de mentira" | Automações, Integrações, Notificações, Documentos, atividades do Dashboard e sino (contador "4") eram dados fixos | Todas ligadas à API real |
| Rotas inexistentes | `/api/workflows/generate/` (URL errada), `/ai/flow-assistant/`, `/automacoes/fluxos/`, `automation-rules/`, `integration-configs/`, `reprocess`, SSO | Corrigidas ou removidas/explicadas na tela; back ganhou `/connections/` |
| Sessão | Refresh duplicado (corrida), logout só apagava localStorage, link "Sair" ia para rota inexistente | Refresh único, logout revoga o token no servidor, 428 e expiração tratados |
| Governança (novo no back) | Sem nenhuma tela | Privacidade e dados, reaceite de termos, Auditoria, IA segura, Centro de Segurança (ISO 27001/27701/LGPD) |
| Observabilidade | Nenhuma | Sentry (sem PII) + ErrorBoundary, `release`/`environment` iguais aos do back |

## 2. Falhas encontradas (por severidade)

### Críticas
1. **Produção servindo o servidor de desenvolvimento** (`npm start` inexistente → contêiner não subia). Corrigido (`CAD-106`).
2. **Cartão de crédito digitado em formulário próprio** (`StepPagamento*`): escopo PCI-DSS e risco de vazamento (ficava em estado React/DevTools). Removido; cobrança só no Stripe Checkout (`CAD-108`).
3. **Cadastro incompatível com o back** (campos antigos, sem plano/CPF válido/aceite LGPD) → todo cadastro falharia com 400. Corrigido (`CAD-108`).
4. **Telas mostrando dados inventados** (ex.: "WhatsApp conectado", automações e documentos fictícios): induzem decisão errada e, em teste, escondem os bugs reais. Ligadas à API (`CAD-108`/`CAD-111`).

### Altas
5. Refresh de token sem controle de concorrência e sem tratar rotação; logout não revogava o refresh → token roubado seguia válido. (`CAD-108`)
6. CSP/headers inexistentes no servidor do front; fonte do Google Fonts (vazava IP ao Google e quebraria um CSP restrito). Fonte local + CSP por ambiente (`CAD-106`).
7. `public/index.html` (resto de Create React App) disputando com o `index.html` do Vite; manifest "Create React App Sample". Removidos.
8. Link "Sair" para `/login` (rota inexistente → tela em branco). Corrigido.
9. Tokens ficam em `localStorage` (risco de roubo por XSS). **Pendente** — requer mudança no back (cookie httpOnly): `CAD-118`.
10. Plano **pago** é atribuído na criação da conta antes do pagamento (back). **Pendente** `CAD-119`.

### Médias
11. Bundle único de 1,1 MB (React Flow + react-pdf no carregamento inicial) → 458 kB com `React.lazy` (`CAD-111`).
12. Sem testes automatizados (agora: flowMapper, cadastro, Markdown).
13. Editor de fluxos enviava `{nodes, edges}` para rota inexistente; blocos que o servidor não executa (SMS, Drive, Slack, condição, e-mail SMTP…) apareciam como se funcionassem. Agora o canvas mapeia para `trigger + actions[]`, blocos indisponíveis aparecem como "Em breve" e bloqueiam o salvamento (`CAD-108`).
14. "Esqueceu a senha" fingia enviar e-mail (`console.log`). Agora avisa a verdade; precisa do back (`CAD-115`).
15. Assistente de tarefas por IA chamava rota inexistente. Agora informa indisponibilidade (`CAD-116`).
16. Login Google/Microsoft: rotas inexistentes no back. Botões ocultos até `VITE_SSO_ENABLED=true` (`CAD-105`).

### Baixas / dívida técnica
17. 22 avisos de ESLint (variáveis sem uso, `useEffect` sem dependência) — limpar gradualmente (`CAD-125`).
18. Páginas legado (`/processos`, `/comunicacao`) fora do menu; `reprocess` inexistente no back.
19. Acessibilidade: vários `div` clicáveis sem teclado/ARIA nos cards antigos; foco/contraste não auditados (`CAD-125`).
20. Estilos misturados (CSS Modules + estilos inline nos componentes novos); sem tokens/tema (`CAD-127`, Design).

## 3. Arquitetura do front (como ficou)

```
src/
  services/      api.js (axios, refresh único, eventos 428/sessão), registration.js, flowMapper.js,
                 connections.js, monitoring.js (Sentry)
  contexts/      AuthContext (login, loginWithTokens, logout no servidor, role/isOrgManager/isStaff)
  routes/        appRoutes.jsx (rotas públicas, privadas, por papel, lazy)
  components/
    common/      Navbar, BarraSup (sino real), PlanPicker, LegalAcceptance, ConnectionModal
    seguranca/   ui kit (Pill, StatCard, ScoreBar…), Markdown seguro, ConsentModal
    ui/          componentes legados + NodeInspector
  pages/
    auth/        login, cadastro individual/empresa, callback SSO
    dashboard/   dashboard, automações, editor de fluxos, integrações, documentos, notificações, equipe, perfil
    seguranca/   Privacidade, Auditoria, IASegura, CentroSeguranca
nginx/           default.conf.template + security-headers.inc.template (CSP com ${API_ORIGIN})
Dockerfile       build → prod (nginx-unprivileged:8080) → dev (vite)
```

Decisões: (a) o front **nunca decide permissão** — esconde telas por `role`/`is_staff` do `/auth/user/`, mas o back é quem recusa (403); (b) nenhum conteúdo do servidor vira HTML (Markdown próprio, sem `dangerouslySetInnerHTML`); (c) credenciais de integração são *somente escrita*; (d) segredos não existem no front (`VITE_*` é público).

## 4. Mapa de telas × API (estado atual)

| Tela | Rotas usadas | Permissão |
|---|---|---|
| Login / cadastro | `auth/token/`, `auth/register/`, `auth/register/empresa/`, `legal/documents/`, `api/billing/plans/`, `api/billing/checkout/` | pública |
| Dashboard | `dashboard/stats/`, `tasks/`, `activities/` | membro |
| Automações / editor | `workflows/`, `workflows/{id}/approve|reject/`, `workflows/generate-from-prompt/`, `connections/`, `automations/stats/` | membro (aprovar: dono/admin) |
| Integrações | `connections/`, `sync-history/` | membro |
| Documentos | `documentos/`, `documentos/{id}/download/` | membro |
| Notificações / sino | `notifications/`, `…/read/`, `…/read-all/`, `…/unread-count/` | membro |
| Privacidade e dados | `legal/documents/`, `legal/consents/(me/)`, `privacy/requests/`, `privacy/me/export/`, `legal/subprocessors/`, `privacy/organization/close/` | membro (encerrar: dono) |
| IA segura | `ai/policy/`, `ai/executions/pending/`, `ai/executions/{id}/review/`, `ai/activity/` | membro (editar/fila/uso: dono/admin) |
| Auditoria | `audit/summary/`, `audit/events/(export/)`, `audit/alerts/(id/)` | dono/admin |
| Centro de Segurança | `security/overview/`, `security/controls/`, `security/checks/`, `security/ropa/` | equipe Cadrius (`is_staff`) |
| Equipe / perfil | `teams/*`, `auth/profile/`, `auth/change-password/` | membro / dono-admin |

## 5. DevSecOps do front — análise

**Cadeia de suprimentos**: lockfile sincronizado e `npm ci` no Docker/CI; `npm audit --omit=dev --audit-level=high` bloqueante; Dependabot (npm, Actions, Docker). *Falta:* fixar actions por SHA, SBOM (`cyclonedx-npm`) e proveniência (`npm publish --provenance` não se aplica; usar `actions/attest-build-provenance` na imagem) → `CAD-128`.

**Superfície no navegador**: CSP restritiva (`script-src 'self'` + Google Identity, `connect-src` só API/Sentry, `frame-ancestors 'none'`, `object-src 'none'`); `style-src 'unsafe-inline'` é necessário hoje (estilos inline do React Flow e dos componentes) → remover com CSS Modules/nonce (`CAD-128`). Cabeçalhos repetidos em cada `location` (o nginx não herda `add_header`). Sem fontes de terceiros. Sem `dangerouslySetInnerHTML`.

**Sessão**: refresh único, revogação no logout, tratamento de 401/428/expiração. *Risco aberto:* JWT em `localStorage` → migrar para cookie `HttpOnly; Secure; SameSite=Lax` + CSRF (`CAD-118`).

**Pipeline**: CI (lint, testes, build, audit, build da imagem e teste de `/healthz` + fallback SPA + CSP); deploy por SSH com `known_hosts` fixo, usuário `deploy` com `sudo` limitado a 4 scripts, `environment` com aprovação em produção, *concurrency* e rollback automático no servidor. Segredos do GitHub: só acesso SSH — **nenhum segredo de aplicação**.

**Runtime**: contêiner sem root, `no-new-privileges`, limites de CPU/memória, healthcheck, logs com rotação; Traefik com TLS ≥ 1.2, HSTS, rate-limit.

**Observabilidade**: Sentry com `release`=SHA, `environment`, só `user.id` e `organization_id` (sem e-mail/nome), URL sem query/fragmento, sem cabeçalho `Authorization`. *Falta:* alerta no Sentry, Lighthouse CI, uptime externo do `app.` (`CAD-129`).

**Privacidade**: sem Google Fonts, sem analytics; aceite de termos com versão+hash; exportação/eliminação de dados na tela Privacidade.

## 6. O que foi validado (e o que não)

Validado: `npm ci`, `npm run lint` (0 erros), `npm test` (13), `npm run build`, `npm audit` (0), configuração do nginx executada de verdade (`envsubst` + `nginx -t` + requisições: SPA, `/healthz`, cache imutável, MIME do worker `.mjs`, CSP), fluxo **cadastro → login → consentimentos gravados → papel OWNER → menu → logout com revogação**, telas de Privacidade/Auditoria/IA/Centro de Segurança com dados reais, conexões, importação/edição/salvamento de fluxo, aprovação de rascunho de IA, documentos (envio/lista/download) — tudo em navegador contra o back real (SQLite).
Não validado: imagem Docker (sem daemon na sandbox), deploy no VPS, Stripe real, SSO, Redis/worker (aprovação de execução retornou 500 só porque o Redis local não existia — ver `CAD-121`).
