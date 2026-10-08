# CAD-233: nova logo do Cadrius e revisão final de UI/UX

## 1. Logo

**Conceito:** o "C" de Cadrius envolve uma **coluna clássica**, a imagem dos tribunais e do Direito. A coluna também representa a base que sustenta o escritório. O símbolo é autêntico, jurídico sem cair no clichê da balança, e continua legível em 16 px (aba do navegador).

| Item | Valor |
|---|---|
| Fundo do símbolo | quadrado arredondado (raio 15/64), degradê `#0a2463` → `#1d4ed8` → `#3b82f6` |
| "C" | branco, traço 6/64, pontas arredondadas |
| Coluna | `#dbeafe` (azul bem claro), capitel e base em trapézio, 3 caneluras |
| Nome | "Cadrius" em Poppins 700, espaçamento −0,02em, **na cor de título do tema** (escuro no claro, claro no escuro) |
| Fundos escuros | `tone="light"`: nome em branco (login, Gestão) |

**Onde está:**

- **Componente:** `src/components/brand/BrandLogo.jsx`
  - `BrandMark`: só o símbolo;
  - `BrandLogo`: símbolo + nome, com `badge` opcional ("Gestão").
- **Ícones** (`public/`):
  - `favicon.svg` e `favicon.ico` (16/32/48/64);
  - `logo192.png` e `logo512.png`;
  - `apple-touch-icon.png` (quadrado, para o iOS);
  - `maskable-512.png` (Android).
  - `theme-color` passou a ser `#0a2463`.
- **Telas que usam:**
  - menu do escritório e topo no celular;
  - login (painel escuro e celular);
  - telas de acesso (esqueci a senha etc.) e cadastro;
  - Gestão Cadrius (menu e topo no celular, com o selo "Gestão");
  - assinatura digital;
  - carregamento entre telas (símbolo pulsando);
  - rodapé "Feito com Cadrius" nas páginas públicas do cliente (portal, captação, pesquisa).

## 2. Revisão completa

- **Cobertura:** 200 capturas automáticas.
  - Escritório: 29 telas.
  - Gestão: 13 telas.
  - Públicas: 8 telas.
  - Cada uma nos temas claro e escuro, em 1366 px e em 390 px.
- **O que cada captura mede:**
  - rolagem lateral;
  - blocos claros esquecidos no tema escuro;
  - texto com contraste abaixo de 3:1;
  - erros no console.
- **Resultado final:** nenhuma rolagem lateral, nenhum bloco claro no escuro, nenhum contraste baixo e nenhum erro. A única exceção é o login, que tem degradê, e foi conferido visualmente.

### Ajustes feitos

| Onde | Antes | Agora |
|---|---|---|
| Nova tarefa | Tela antiga, com responsáveis fictícios ("João Silva", "Maria Santos") e um "assistente" que só respondia "ainda não disponível" | Formulário no padrão do sistema: responsável vem da equipe real, prioridade em botões, "Colocar no meu Google Agenda" quando conectado. Atalhos abrem o Assistente com o pedido já escrito. |
| Comunicação | Página órfã com "E-mail Conectado" fixo e `alert()` | Removida. O endereço leva a "Processos por e-mail". |
| Finanças (e todo indicador) | Valor cortado ("R$ 21.60…") | A fonte acompanha a largura do cartão; o valor aparece inteiro. |
| Processos, Contatos e regras de Automações no celular | Tabela espremida (cliente cortado, e-mail truncado) | Cada linha vira um cartão com o rótulo de cada campo. |
| Regras de Automações | 5 botões grandes por linha, quebrando em 2 linhas | "Abrir" em destaque e as outras ações discretas, numa linha só. |
| Auditoria | Códigos técnicos (`auth.login.success`, `data.bulk_read`) | Texto em português para as 176 ações ("Entrada no sistema", "Consulta de listas"…), com o código no balão para o suporte. |
| Carregamento | "Carregando…" solto em 36 telas | Barras animadas no padrão do sistema; entre telas, o símbolo do Cadrius pulsando. |
| Vazios | "Nenhuma notificação por enquanto." e "Nada aguardando decisão." em texto solto | Estado vazio ilustrado ("Tudo em dia", "Nada esperando você"). |
| Selo LOCAL/TESTE e prioridade "Média" | Contraste baixo (2,4 e 2,8) | Cores do tema, legíveis no claro e no escuro. |
| Cores fixas | Tons fixos em indicadores, prazos e cláusulas | Tokens do tema (`--c-warning`, `--c-danger`, `--c-success`). |
| Portal, captação e pesquisa (páginas do cliente) | Cores fixas: no tema escuro, cartão claro com texto claro | Só tokens do tema, mais o rodapé "Feito com Cadrius". |
| Importar dados | "Ver processos" levava a Processos por e-mail | Leva a Processos (acompanhamento), onde os importados aparecem. |
| Gestão no celular | Topo sem marca, só o e-mail | Logo com o selo "Gestão". |
| Contatos | "—" quando não há CPF/CNPJ | A linha só aparece quando existe o documento. |
