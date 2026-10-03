# Plano do front-end por equipe (próximos ciclos)

Legenda: **P0** bloqueia teste/produção · **P1** antes do piloto com clientes · **P2** melhoria. Cards no padrão `CAD-nnn` (branch com o mesmo nome). As entregas já feitas estão em `ANALISE_FRONT_END.md`.

## Marcos
1. **M1 — Teste na web (esta semana):** deploy de teste funcionando (`CAD-106` ✅), cadastro/login/telas principais ✅, back com `connections` ✅. Falta: DNS correto, `Develop` com o kit, SSO oculto.
2. **M2 — Piloto (2–3 semanas):** `CAD-105` (SSO), `CAD-115` (senha), `CAD-119` (cobrança correta), `CAD-118` (cookie httpOnly), `CAD-123/124` (telas), `CAD-126` (E2E).
3. **M3 — Produção:** `CAD-125` (acessibilidade), `CAD-128/129` (DevSecOps), `CAD-097…099` (design system e fluxos LGPD).

---

## A. Front-end (Ryan)

### P0
**CAD-113: Task - Revisar e mergear as branches do front** · `CAD-106` (Docker/CI) → `CAD-108` (alinhamento) → `CAD-109` (segurança) → `CAD-111` (documentos/lazy/testes) → `CAD-112` (Sentry). Cada uma contém a anterior. Aceite: `Develop` e `main` com CI verde; `app-teste.cadrius.ia.br` abre.

**CAD-124: Task - Detalhe da automação** · tela `/automacao/:id` com: URL secreta do webhook (campo `trigger.webhook_token` → `POST /api/workflows/webhooks/catch/<token>/`, botão copiar), histórico de execuções (status, erro, duração), botão "Executar agora" (quando existir no back), rascunho de IA com comparação antes de aprovar. Aceite: dono consegue configurar um gatilho de webhook sem sair do sistema.

### P1
**CAD-123: Task - Atividade da conta** · "meus logins/ações" e sessões ativas (encerrar). Depende do back `CAD-090` (`audit/me/`, `auth/sessions/`). Aceite: usuário vê e encerra sessões; evento auditado.

**CAD-126: Task - Testes E2E (Playwright) no CI** · smoke: cadastro → login → criar conexão → importar/salvar fluxo → privacidade (exportar dados) → logout, rodando contra `app-teste` após o deploy de `Develop`. Aceite: job `e2e` bloqueia a promoção para `main`.

**CAD-130: Task - Equipe e créditos** · revisar `GestaoEquipe` com o back novo (`teams/credits/`, `teams/members/{id}/credits/`, convites por papel, limite do plano) e estados de erro (limite de usuários).

**CAD-131: Task - Perfil e plano** · exibir plano atual (`api/billing/plans/current/`), próxima cobrança, botão "Assinar" → Stripe; retorno `?payment=success|cancelled` com toast; troca de senha (`auth/change-password/`) com política de senha do back.

**CAD-132: Task - Estados de erro/vazio/carregando padronizados** · skeletons, mensagens de 403/404/429/503 (usar `errorMessage`), banner de manutenção quando `readyz` falhar.

### P2
**CAD-125: Task - Acessibilidade WCAG 2.1 AA** · teclado em todos os cards/linhas clicáveis, `aria-*`, foco visível, contraste, `prefers-reduced-motion`, `axe-core` no CI. **CAD-133: Task - Limpar 22 avisos de ESLint** e ativar `--max-warnings 0`. **CAD-134: Task - Remover páginas legado** (`/processos`, `/comunicacao`) ou reativá-las com `emails/` real.

---

## B. Back-end (Thales) — o que o front precisa

### P0
**CAD-105: Task - SSO Google/Microsoft** · `GET auth/google|microsoft/` (início) e callback que **redireciona para `https://app…/google/callback#access=…&refresh=…`** (fragmento, não query), exige/registra aceite de termos (428 se faltar), auditoria `auth.login.success` com `auth_method`. Aceite: login social funciona; `VITE_SSO_ENABLED=true` liga os botões.

**CAD-119: Task - Plano pago só após pagamento confirmado** · hoje `auth/register` aceita `plano_id` pago e já atribui o plano. Criar a organização no plano gratuito e só trocar no webhook do Stripe (`checkout.session.completed`); validar `success_url` e idempotência. Aceite: teste cria conta com plano pago e confirma plano FREE até o webhook.

### P1
**CAD-115: Task - Recuperação de senha por e-mail** · `POST auth/password-reset/` e `/confirm/` (token de uso único, 30 min, resposta idêntica exista ou não o e-mail, rate limit, auditoria, e-mail transacional — depende de `CAD-080`). Front: telas "Esqueci a senha" e "Nova senha".

**CAD-118: Task - Refresh em cookie `HttpOnly`** · `Set-Cookie: refresh=…; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth/`, `access` só em memória; CSRF para as rotas de cookie; ajuste de CORS (`credentials`). Aceite: nenhum token em `localStorage`.

**CAD-090: Task - API de escrita do Centro de Segurança e atividade da conta** (já no backlog) — habilita `CAD-123` e a avaliação manual de controles na tela React.

**CAD-116: Task - Assistente de tarefas por IA** · `POST ai/tasks/suggest/` (passa por `run_guarded`, sem conteúdo no log) retornando `{titulo, descricao, dataHorario, prioridade}`; ou remover o painel.

**CAD-122: Task - Documentos** · `DELETE documentos/{id}/`, `PATCH` de status/tipo, extração por IA (liga `extraction/`), tipos aceitos validados por *magic bytes* e limite de 10 MB no servidor, antivírus (ClamAV) no upload.

**CAD-080: Task - Executor `EMAIL_SMTP`** (já no backlog) — hoje o runner lança "não implementado"; o bloco "Enviar e-mail" fica "Em breve" no editor até lá. **CAD-135: Task - Executores de SMS/Drive/Slack e blocos de condição/espera** (ou retirar da biblioteca).

### P2
**CAD-121: Task - 503 quando o broker (Redis) cair** · `ai/executions/{id}/review/` e criação de execução devolvem 500 se o Django-Q não enfileira; capturar e responder 503 com `Retry-After` + reverter o estado.

---

## C. Design (Allan)

**CAD-097/098/099** (já no backlog) + novos:
**CAD-127: Task - Design tokens e tema** · variáveis CSS (cores, espaçamentos, tipografia, raio, sombras) a partir das telas novas (`seguranca.module.css`), modo escuro, componentes: botão, input, tabela, pill, modal, banner, abas, *toast*. Entregável: biblioteca no Figma + tokens em JSON.
**CAD-136: Task - Editor de fluxos (UX)** · painel de propriedades por bloco (hoje simples), validação inline, teste de fluxo com dados de exemplo, estados "em breve", mapa de variáveis `{{campo}}`, mobile (somente leitura).
**CAD-137: Task - Cadastro e planos** · cadastro curto (menos passos), comparação de planos, tela "pagamento pelo Stripe" (substitui o formulário de cartão), mensagens de erro por campo; microcopy LGPD revisada pelo jurídico.
**CAD-138: Task - Telas de segurança** · hierarquia visual de severidade, estados vazios/erro, impressão/PDF do relatório de conformidade, usabilidade com 5 advogados e 2 pessoas de TI.
Acessibilidade: guia de contraste, foco e tamanhos de toque; revisar ícones sem texto (sino, ações de linha).

---

## D. DevSecOps (Jullio)

### P0 (antes do primeiro deploy)
- **DNS** `A` de `app`, `api`, `app-teste`, `api-teste`, `logs`, `@`, `www` → `191.252.221.133` (hoje `api`/`app` apontam para outro IP) + registro **CAA** (`0 issue "letsencrypt.org"`).
- **Branches**: criar `Develop` no back e no front a partir da `main`; proteger `main` (PR + CI verde + 1 revisão); *environments* `staging` e `production` (aprovação manual) no GitHub; secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`.
- Rodar `bootstrap.sh` (kit `deploy/` do back) e conferir `app-teste` com `sudo cadrius-status`.

### P1
**CAD-128: Task - Endurecimento da cadeia de suprimentos e do navegador** · actions por SHA; SBOM (CycloneDX) e atestado de proveniência da imagem; `npm audit signatures`; CSP sem `'unsafe-inline'` em estilos (migrar estilos inline para CSS Modules ou nonce por requisição); Trusted Types (`require-trusted-types-for 'script'` em modo *report-only* primeiro); `security.txt`; HSTS com *preload* após estabilizar; remover `Server`/versões.
**CAD-129: Task - Observabilidade do front** · regra de alerta Sentry (erros novos, regressão por `release`), *source maps* enviados ao Sentry e **não publicados**, Lighthouse CI (desempenho ≥ 85, acessibilidade ≥ 90), uptime externo de `app.` e `api.` (`/readyz/`), orçamento de bundle (falha se o inicial > 600 kB).
**CAD-139: Task - Cabeçalhos de borda** · mover os cabeçalhos de segurança para o Traefik (um lugar só) e deixar no nginx apenas `Cache-Control`; relatórios CSP (`report-to`) recebidos pelo back e mostrados no Centro de Segurança.
**CAD-140: Task - Staging isolado** · *basic auth* ou allowlist de IP em `app-teste`/`api-teste`; e-mails de teste capturados (Mailpit); chaves Stripe `sk_test_`; nunca dados de produção (já garantido por `seed_staging`).

### P2
Backup/restauração do front não se aplica (estático); manter **imagem anterior** para rollback rápido (`deploy.sh` já volta ao commit anterior); revisão trimestral de dependências; DAST (OWASP ZAP baseline) contra `app-teste` no pipeline.

---

## E. Ordem sugerida (próximas 3 semanas)

| Semana | Front | Back | Design | DevSecOps |
|---|---|---|---|---|
| 1 | `CAD-113` (merge), `CAD-124`, `CAD-131` | `CAD-119`, `CAD-121` | `CAD-127` (tokens), `CAD-137` | DNS, branches, bootstrap, `CAD-140` |
| 2 | `CAD-123`, `CAD-130`, `CAD-126` | `CAD-105`, `CAD-115`, `CAD-090` | `CAD-136`, `CAD-138` | `CAD-129`, `CAD-139` |
| 3 | `CAD-125`, `CAD-132`, `CAD-133` | `CAD-118`, `CAD-122`, `CAD-080` | acessibilidade, usabilidade | `CAD-128`, DAST |

## F. Critérios de aceite do "pronto para piloto"
Cadastro → login → fluxo de automação real → aprovação de IA → privacidade (exportar/eliminar) em `app.`; `npm audit` e `bandit` sem altas; CI verde em ambos os repositórios; backup restaurado com sucesso no simulado; sem tokens em `localStorage`; plano pago só após o Stripe confirmar.
